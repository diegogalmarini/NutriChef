// This file converts SVG icons into base64 data URIs for embedding in jsPDF.
// The icons are styled to match the application's theme for consistency.

const svgToBase64 = (svg: string): string => `data:image/svg+xml;base64,${btoa(svg)}`;

const createSvg = (path: string, viewBox = "0 0 20 20", fill = "#475569" /* slate-600 */): string => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${fill}" width="20" height="20">
  ${path}
</svg>
`;

// NutriChef Logo, adapted for the PDF header with a white fill
const logoSvg = `
<svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 13.25C14.5 12.0074 15.5074 11 16.75 11C17.9926 11 19 12.0074 19 13.25V21H14.5V13.25Z" fill="#FFFFFF" fill-opacity="0.7"/>
    <path d="M5 13.25C5 12.0074 6.00736 11 7.25 11C8.49264 11 9.5 12.0074 9.5 13.25V21H5V13.25Z" fill="#FFFFFF" fill-opacity="0.7"/>
    <path d="M9.5 16.25C9.5 15.0074 10.5074 14 11.75 14C12.9926 14 14 15.0074 14 16.25V21H9.5V16.25Z" fill="#FFFFFF" fill-opacity="0.7"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4V8.53554C13.9926 8.53554 15 9.5429 15 10.7855V11.25H9V10.7855C9 9.5429 10.0074 8.53554 11.25 8.53554V4C11.25 3.58579 11.5858 3.25 12 3.25ZM16.5 9.75C16.9142 9.75 17.25 10.0858 17.25 10.5V11.25H19.5V10.75C19.5 8.67893 17.8211 7 15.75 7C14.7364 7 13.844 7.39953 13.187 8.03153C12.8256 8.2431 12.7214 8.7402 12.933 9.10157C13.1445 9.46294 13.6417 9.5671 14.0031 9.35553C14.4442 9.10023 14.9546 8.97341 15.5 9.00638V9.75H16.5ZM8.5 7C6.42893 7 4.75 8.67893 4.75 10.75V11.25H7V10.5C7 10.0858 7.33579 9.75 7.75 9.75H8.5V9.00638C9.04543 8.97341 9.55578 9.10023 9.99691 9.35553C10.3583 9.5671 10.8555 9.46294 11.067 9.10157C11.2786 8.7402 11.1744 8.2431 10.813 8.03153C10.156 7.39953 9.26359 7 8.25 7H8.5Z" fill="#FFFFFF"/>
</svg>
`;

const servingsPath = `<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />`;
const prepPath = `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clip-rule="evenodd" />`;
const cookPath = `<path d="M12,2C12,2,11,4,10,5C9,6,7,7,7,10C7,13,10,16,12,22C14,16,17,13,17,10C17,7,15,6,14,5C13,4,12,2,12,2Z"/>`;
const caloriesPath = `<path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />`;

export const pdfIcons = {
    logo: svgToBase64(logoSvg),
    servings: svgToBase64(createSvg(servingsPath)),
    prep: svgToBase64(createSvg(prepPath)),
    cook: svgToBase64(createSvg(cookPath, "0 0 24 24")),
    calories: svgToBase64(createSvg(caloriesPath)),
};