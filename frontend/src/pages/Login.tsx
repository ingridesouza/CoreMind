import React, { useState } from "react";
import api from "../lib/api";

export default function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/users/token/", { username: u, password: p });
      localStorage.setItem("access", data.access);
      setMsg("Login OK");
    } catch {
      setMsg("Credenciais inválidas");
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={submit}>
      <input placeholder="username" value={u} onChange={(e) => setU(e.target.value)} />
      <input
        placeholder="password"
        type="password"
        value={p}
        onChange={(e) => setP(e.target.value)}
      />
      <button type="submit">Entrar</button>
      <p>{msg}</p>
      </form>
    </div>
  );
}
