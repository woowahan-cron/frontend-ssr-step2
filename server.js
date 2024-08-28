import dotenv from "dotenv";
dotenv.config(); // .env 파일에서 환경 변수를 로드합니다.

import http from "http";
import fetch from "node-fetch";
import https from "https";

// SSL 인증서 무시를 위한 에이전트 설정
const agent = new https.Agent({ rejectUnauthorized: false });

const BASE_URL = "https://api.themoviedb.org/3/movie";
const urls = [
  `${BASE_URL}/popular?language=en-US&page=1`,
  `${BASE_URL}/now_playing?language=en-US&page=1`,
  `${BASE_URL}/top_rated?language=en-US&page=1`,
  `${BASE_URL}/upcoming?language=en-US&page=1`,
];
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
  },
  agent,
};

console.log("TMDB_TOKEN:", process.env.TMDB_TOKEN); // TMDB_TOKEN 값이 제대로 로드되는지 확인합니다.

const loadMovies = async () => {
  const movieData = await Promise.all(urls.map((url) => fetch(url, options).then((res) => res.json())));
  return {
    popularMovies: movieData[0].results,
    nowPlayingMovies: movieData[1].results,
    topRatedMovies: movieData[2].results,
    upcomingMovies: movieData[3].results,
  };
};

const generateHTML = (movieLists) => {
  const { popularMovies, nowPlayingMovies, topRatedMovies, upcomingMovies } = movieLists;

  const sections = [
    { title: "Popular Movies", movies: popularMovies },
    { title: "Now Playing", movies: nowPlayingMovies },
    { title: "Top Rated", movies: topRatedMovies },
    { title: "Upcoming", movies: upcomingMovies },
  ];

  const movieSections = sections
    .map(
      ({ title, movies }) => `
    <h2>${title}</h2>
    <ul>
      ${movies
        .map(
          ({ id, title, overview, release_date }) => `
        <li key="${id}">
          <div>
            <h3>${title}</h3>
            <p>${overview}</p>
            <p>Release Date: ${release_date}</p>
          </div>
        </li>`
        )
        .join("")}
    </ul>
    <hr />
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SSR with Node.js</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          ul { list-style-type: none; padding: 0; }
          li { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Movie Lists</h1>
        ${movieSections}
      </body>
    </html>
  `;
};

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    const movieLists = await loadMovies();
    const htmlContent = generateHTML(movieLists);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(htmlContent);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
