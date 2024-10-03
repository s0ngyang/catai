let API_URL = "http://localhost:8000";

if (process.env.NODE_ENV === "production") {
  API_URL = "https://api.example.com";
}

export { API_URL };
