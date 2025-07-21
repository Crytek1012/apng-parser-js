# APNG Parser

A simple parser for APNG (Animated Portable Network Graphics) files in Node.js.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [License](#license)
- [Contributing](#contributing)
- [Author](#author)

## Installation

You can install the `apng-parser-js` package using npm:

```bash
npm install apng-parser-js
```

## Usage

CommonJs:

```javascript
const { readFileSync } = require('fs');
const apngParser = require('apng-parser-js');
```

Import:

```javascript
import { readFileSync } from 'fs';
import apngParser from 'apng-parser-js';
```

Parse an APNG:

```javascript
const buffer = readFileSync(filePath);
const apng = apngParser(buffer);
```

You can directly save the frames by using the ```APNG``` method ```saveFrames()```:

```javascript
apng.saveFrames('path-to-your-folder');
```

Or save a specifc frame by using the ```Frame``` method ```save()```:

```javascript
const frame = apng.frames[0];
frame.save('path-to-your-folder');
```

You can retrieve the raw pixel data by using the method `.getRGBA`

```javascript
const frame = apng.frames[0];
const rgba = frame.getRGBA();
```

### Example Response

```json
APNG {
  width: 320,
  height: 320,
  bitDepth: 8,
  colorType: 3,
  compressionMethod: 0,
  filterMethod: 0,
  interlaceMethod: 0,
  palette: <Buffer 36 39 3f 00 00 00 38 33 45 d7 a4 8c 46 3e 44 02 02 02 c5 14 04 3c 36 49 cf 9f 68 3a 35 48 35 35 35 39 34 46 f1 c7 78 05 05 06 0a 09 0b 22 22 23 0d 0c ... 718 more bytes>,
  transparency: <Buffer 00>,
  frameCount: 11,
  loopCount: 0,
  frames: [
    Frame {
      width: 320,
      height: 320,
      left: 0,
      top: 0,
      delayNum: 3,
      delayDen: 100,
      disposeOp: 1,
      blendOp: 0,
      bitDepth: 8,
      colorType: 3,
      transparency: <Buffer 00>,
      palette: <Buffer 36 39 3f 00 00 00 38 33 45 d7 a4 8c 46 3e 44 02 02 02 c5 14 04 3c 36 49 cf 9f 68 3a 35 48 35 35 35 39 34 46 f1 c7 78 05 05 06 0a 09 0b 22 22 23 0d 0c ... 718 more bytes>,
      data: <Buffer 78 da ed 7d 77 74 54 f7 9d 2f 23 e9 32 1a 0d 77 7a b1 1a 23 69 66 24 a1 82 46 1e 15 46 bd d2 0d 46 b2 91 ad 42 10 06 1b 21 10 dd 20 d1 bb 29 a6 99 6e ... 17994 more bytes>,
      rgba: null
    },
    // other frames
  ]
}
```

## License

This project is licensed under the [ISC License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Author

Created by [Crytek1012](https://github.com/Crytek1012).