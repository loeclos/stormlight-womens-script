# Women's Script Generator

## Overview

Welcome to the Women's Script Generator, a web application designed to convert text into the fictional women's script from Brandon Sanderson's *The Stormlight Archive*. This project allows users to input text, apply custom substitutions, and generate stylized SVG or PNG images of the script with various formatting options.

## Features

- Convert English text into women's script symbols.
- Customize text alignment, color, stroke width, scale, and italics angle.
- Support for word and character substitutions to handle unique pronunciations or missing symbols.
- Download generated images in SVG or PNG format.
- Interactive UI with accordion-based settings and real-time previews.

## Technologies Used

- **Framework**: Next.js - A React-based framework for server-side rendering and static site generation.
- **Styling**: Tailwind CSS - Utility-first CSS framework for rapid UI development.
- **Components**: Custom UI components built with React and styled using Tailwind CSS.
- **SVG Manipulation**: DOMParser and XMLSerializer for dynamic SVG generation.
- **TypeScript**: For type safety and better developer experience.
- **Dependencies**: Includes eslint, prettier, and other development tools for code quality.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ACLay/stormlight-womens-script.git
   ```
2. Navigate to the project directory:
   ```bash
   cd womens-script-generator
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Run the development server:
   ```bash
   pnpm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Usage

- Enter your text in the textarea provided.
- Adjust formatting options such as color, alignment, and scale using the accordion menu.
- Add custom word or character substitutions to tailor the script to your needs.
- Download the generated image by clicking the "Download as PNG" button.

## Project Structure

- `public/`: Static assets including SVG symbol files.
- `src/`: Source code directory.
  - `app/`: Main application pages and layouts.
  - `components/`: Reusable React components.
- `node_modules/`: Project dependencies.
- Configuration files (e.g., `next.config.ts`, `tsconfig.json`, etc.) for build and development settings.

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any enhancements or bug fixes. Ensure your code adheres to the existing style guidelines and includes appropriate tests.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- Inspired by the *Stormlight Archive* series by Brandon Sanderson.
- Thanks to the open-source community for tools like Next.js and Tailwind CSS.