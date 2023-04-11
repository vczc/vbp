#!/bin/bash
if find . -name "*.vsix" -print -quit | grep -q .; then
    rm *.vsix
fi

vsce package
