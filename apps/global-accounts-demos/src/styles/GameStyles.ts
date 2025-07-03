import { createGlobalStyle } from "styled-components";

export const GameStyles = createGlobalStyle`
  body {
    background: #1a1a1a;
    color: white;
    font-family: 'Arial', sans-serif;
  }

  h1, h2 {
    text-align: center;
    color: #4CAF50;
  }

  .countdown {
    font-size: 4rem;
    font-weight: bold;
    text-align: center;
    color: #4CAF50;
  }
`;
