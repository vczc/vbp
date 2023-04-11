import * as React from 'react';
import './scroll-bar.css';

interface ScrollBarProps {
  axis: string;
  width: number;
  height: number;
  viewport: any;
  scrollWidth: number;
  scrollHeight: number;
  dispatchMouseEvent: (event: any) => any;
  handleMouseEvent: (event: any) => void;
}

// 位移距离
const DISTANCE: number = 20;

// 某个滚动条两个按钮的宽高之和
const BTNDOUBLEWH = 24;

export default class ScrollBar extends React.PureComponent<ScrollBarProps, any> {
  private pageX: number;
  private pageY: number;
  private isScroll: boolean;

  constructor(props: ScrollBarProps) {
    super(props);
    this.pageX = 0;
    this.pageY = 0;
    this.isScroll = false;
  }

  // 滚轮滚动操作
  private wheelScrollAction = ({ deltaX = 0, deltaY = 0 }) => {
    this.props.dispatchMouseEvent({
      type: 'wheel',
      deltaX,
      deltaY,
      offsetX: 0,
      offsetY: 0
    });
  };

  // 鼠标按下事件处理
  private mouseDownHandler = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, type: 'x' | 'y') => {
    this.isScroll = true;

    if (type === 'x') {
      this.pageX = event.clientX;
      document.addEventListener('mousemove', this.mouseMoveHandlerX);
    } else {
      this.pageY = event.clientY;
      document.addEventListener('mousemove', this.mouseMoveHandlerY);
    }

    document.addEventListener('mouseup', this.mouseUpHandler);
  };

  // X轴鼠标移动事件处理
  private mouseMoveHandlerX = (event: MouseEvent) => {
    if (!this.isScroll) return;

    event.preventDefault();

    const { pageX, wheelScrollAction } = this;
    const { clientX } = event;

    let deltaX = clientX - pageX;
    deltaX = clientX >= pageX ? deltaX + DISTANCE : deltaX - DISTANCE;

    wheelScrollAction({ deltaX });

    this.pageX = clientX;
  };

  // Y轴鼠标移动事件处理
  private mouseMoveHandlerY = (event: MouseEvent) => {
    if (!this.isScroll) return;

    event.preventDefault();

    const { pageY, wheelScrollAction } = this;
    const { clientY } = event;

    let deltaY = clientY - pageY;
    deltaY = clientY >= pageY ? deltaY + DISTANCE : deltaY - DISTANCE;

    wheelScrollAction({ deltaY });

    this.pageY = clientY;
  };

  // 鼠标抬起事件处理
  private mouseUpHandler = (event: MouseEvent) => {
    this.isScroll = false;
    document.removeEventListener('mousemove', this.mouseMoveHandlerX);
    document.removeEventListener('mousemove', this.mouseMoveHandlerY);
    document.removeEventListener('mouseup', this.mouseUpHandler);
  };

  public render() {
    let scrollBarY = null;
    if (this.props.scrollHeight > this.props.viewport.height) {
      scrollBarY = (
        <div style={{ width: '20px', height: `${this.props.height}px` }} className="y-resize-scroll">
          <div
            className="resize-scroll-y-btn resize-scroll-y-top"
            onClick={() => {
              this.wheelScrollAction({ deltaY: -100 });
            }}
          ></div>
          <div
            style={{
              height: `${this.props.height - BTNDOUBLEWH}px`,
              display: 'flex',
              justifyContent: 'center',
              position: 'relative'
            }}
            onWheel={(event) => {
              this.props.handleMouseEvent(event);
            }}
          >
            <div
              className="resize-scroll-y"
              onMouseDown={(event) => {
                this.mouseDownHandler(event, 'y');
              }}
              style={{
                height: `${(this.props.height - BTNDOUBLEWH) *
                  (this.props.viewport.height / this.props.scrollHeight)}px`,
                top: `${(this.props.height - BTNDOUBLEWH) *
                  (this.props.viewport.scrollOffsetY / this.props.scrollHeight)}px`
              }}
            ></div>
          </div>
          <div
            className="resize-scroll-y-btn resize-scroll-y-button"
            onClick={() => {
              this.wheelScrollAction({ deltaY: 100 });
            }}
          ></div>
        </div>
      );
    }

    let scrollBarX = null;
    if (this.props.scrollWidth > this.props.viewport.width) {
      scrollBarX = (
        <div style={{ width: `${this.props.width}px`, height: `20px` }} className="x-resize-scroll">
          <div
            className="resize-scroll-x-btn resize-scroll-x-left"
            onClick={() => {
              this.wheelScrollAction({ deltaX: -100 });
            }}
          ></div>
          <div
            style={{
              width: `${this.props.width - BTNDOUBLEWH}px`,
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
            onWheel={(event) => {
              this.props.handleMouseEvent(event);
            }}
          >
            <div
              className="resize-scroll-x"
              onMouseDown={(event) => {
                this.mouseDownHandler(event, 'x');
              }}
              style={{
                width: `${(this.props.width - BTNDOUBLEWH) * (this.props.viewport.width / this.props.scrollWidth)}px`,
                left: `${(this.props.width - BTNDOUBLEWH) *
                  (this.props.viewport.scrollOffsetX / this.props.scrollWidth)}px`
              }}
            ></div>
          </div>
          <div
            className="resize-scroll-x-btn resize-scroll-x-right"
            onClick={() => {
              this.wheelScrollAction({ deltaX: 100 });
            }}
          ></div>
        </div>
      );
    }
    return <>{this.props.axis === 'y' ? scrollBarY : scrollBarX}</>;
  }
}
