const express = require("express"); // require --> commonJS
const crypto = require("node:crypto");
const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");
const cors = require("cors");

const app = express();
app.use(express.json()); // retrieve request
app.disable("x-powered-by"); // disable the header X-Powered-By: Express

// methods normal = GET/HEAD/POST
// methods complex = PUT/PATCH/DELETE

// CORS PRE-Flight
// Options
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        "http://localhost/8080",
        "http://localhost/1234",
        "http://movies.com",
        "http://midu.dev.com",
        "http://127.0.0.1:5500",
      ];

      if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.get("/", (req, res) => {
  res.json({ message: "hola mundo" });
});

// GET
// retrieve all movies by genre
app.get("/movies", (req, res) => {
  // when request is from the same origin
  // http://localhost:1234 -> http://localhost:1234
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }

  res.json(movies);
});

// delete
app.delete("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movies.splice(movieIndex, 1);
  return res.json({ message: "Movie deleted" });
});

// all resources that are movies are identified with /movies
app.get("/movies", (req, res) => {
  // read format query parameter ...
  res.json();
});

// retrieve the movies by id
app.get("/movies/:id", (req, res) => {
  // path-to-regexp
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);

  res.status(404).json({ message: "Movie not found" });
});

// POST
// create movie
app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    // 422 Unprocessable Entity
    return res.status(422).json({ error: JSON.parse(result.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data,
  };

  // this would not be REST, because we're saving the state of application in memory
  movies.push(newMovie);
  res.status(201).json(newMovie); // update client cache
});

// PATCH
// update a movie
app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);
  if (result.error) {
    return res.status(422).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;
  return res.json(updateMovie);
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`)
);
