# Third-party licenses

## 5etools build tooling

`scripts/build-srd-pack.mjs` and `scripts/lib/fivetools-srd.mjs` are development-time tooling
that reads a local 5etools-src checkout (gitignored, never shipped) to generate the committed
`src/packs/*.json` files. That tooling is derived from / built against the 5etools project's own
data conventions.

```
MIT License

Copyright (c) 2017 TheGiddyLimit and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

This covers the build-time tooling only. It is not the license for Bring Your Own 5e's own code
(see LICENSE.md) and not the license for the SRD content itself (see NOTICE.md).
