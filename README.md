# Manic Map Tools

Welcome to the **Manic Miners Map Tools** project! This repository contains a collection of tools designed to work with Manic Miners game maps. These tools allow you to clean, analyze, and generate visual representations of map data files.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [License](#license)

## Installation

To get started with this project, you need to have Node.js and npm installed on your machine. Follow the steps below to set up the project:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/manic-miners-map-tools.git
   cd manic-miners-map-tools
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

## Usage

This project includes several scripts to process and analyze map data files. Before running any scripts, make sure to configure the environment variables.

### Environment Variables

Create a `.env` file in the root directory of the project and add the following environment variables:

```env
MMT_CATALOG_DIR=C://Users//YourUsername//Desktop//discordChannelBot//pngme
MMT_CATALOG_DIR=C://Users//YourUsername//Desktop//discordChannelBot//downloads
MMT_CLEANME_DIR=C://Users//YourUsername//Desktop//discordChannelBot//cleanme
MMT_MAPDATA_DIR=C://Users//YourUsername//Desktop//discordChannelBot//downloads
```

### Running Scripts

You can run the scripts using npm commands. Here are the available scripts:

- **Clean Map Files**

  ```bash
  npm run cleanMapFiles
  ```

  Cleans the map files by removing non-printable characters and normalizing line endings.

- **Generate PNG**

  ```bash
  npm run generateMapPNG
  ```

  Generates PNG images from `.dat` map files.

- **Map Integrity Check**

  ```bash
  npm run mapIntegrityCheck
  ```

  Checks the integrity of map tiles and logs the results.

- **Determine Average Map Size**

  ```bash
  npm run determineAVGMapSize
  ```

  Calculates the average size of map files.

- **Log Map Data Stats**

  ```bash
  npm run logMapDataStats
  ```

  Logs the statistics of map data files.

- **Minify Project**

  ```bash
  npm run minify
  ```

  Minifies the project directory and logs the structure and contents.

## Project Structure

The project is organized as follows:

```plaintext
manic-miners-map-tools/
├── dist/                         # Compiled JavaScript files
├── src/                          # Source TypeScript files
│   ├── functions/                # Utility functions
│   ├── types/                    # TypeScript types
├── scripts/                      # Scripts to run various tasks
│   ├── averageMapSize.ts         # Script to calculate average map size
│   ├── cleanMapFile.ts           # Script to clean map files
│   ├── generatePNG.ts            # Script to generate PNG from map files
│   ├── logMapDataStats.ts        # Script to log map data statistics
│   ├── mapIntegrityCheck.ts      # Script to check map tile integrity
│   ├── minifyProject.ts          # Script to minify the project directory
├── fileParser/                   # Modules to parse map files
│   ├── mapFileParser.ts          # Map file parser
│   ├── types.ts                  # TypeScript types for parsed data
│   ├── utils.ts                  # Utility functions
├── assets/                       # Asset files
├── .env                          # Environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # npm package configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project README file
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

Feel free to contribute to this project by opening issues and submitting pull requests. If you have any questions or need further assistance, please contact the project maintainer.

Happy mapping!

## Additional Information

To generate a PNG image from a `.dat` file, you can run the following command:

```bash
npm run generate

```

![Demo PNG](https://github.com/Wal33D/manic-map-tools/blob/master/demo.png)
