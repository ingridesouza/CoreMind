import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Home() {
  const [status, setStatus] = useState("loading...");
  useEffect(() => {
    api
      .get("/api/health/")
      .then((r) => setStatus(r.data.status))
      .catch(() => setStatus("error"));
  }, []);
  return (
    <div>
      <h1>Boilerplate OK</h1>
      <p>Health: {status}</p>
    </div>
  );
}
