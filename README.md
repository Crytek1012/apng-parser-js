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

async function parseAPNG(filePath) {
    const buffer = readFileSync(filePath);
    try {
        const apng = apngParser(buffer);
        console.log(apng);
    } catch (err) {
        console.error('Error parsing APNG:', err);
    }
}

parseAPNG('path/to/your/file.png');
```

Import:

```javascript
import { readFileSync } from 'fs';
import apngParser from 'apng-parser-js';

async function parseAPNG(filePath) {
    const buffer = readFileSync(filePath);
    try {
        const apng = apngParser(buffer);
        console.log(apng);
    } catch (err) {
        console.error('Error parsing APNG:', err);
    }
}

parseAPNG('path/to/your/file.png');
```

## API

### `apngParser(buffer: Uint8Array): <APNG>`

Parses the provided APNG buffer and returns an object containing the metadata of the APNG file.

#### Parameters
- `buffer`: A Buffer containing the binary data of the APNG file.

#### Returns
- A Promise that resolves to an object containing the APNG metadata.

### Example Response

```json
{
  "width": 300,
  "height": 300,
  "frameCount": 4,
  "loopCount": 0,
  "frames": [
    {
      "top": 0,
      "left": 0,
      "width": 300,
      "height": 300,
      "delayNum": 0,
      "delayDen": 0,
      "delay": 100,
      "disposeOp": 1,
      "blendOp": 0,
      "imageData": [Uint8Array]
    },
    // More frames...
  ]
}
```

## License

This project is licensed under the [ISC License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Author

Created by [Crytek1012](https://github.com/Crytek1012).