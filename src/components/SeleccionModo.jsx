import React from "react";
import { FaIndustry, FaCashRegister } from "react-icons/fa";
import logo from "../assets/logo1.png";

export default function SeleccionModo({ onSeleccion }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f8",
      }}
    >
      <img
        src={logo}
        alt="Logo"
        style={{
          width: "min(320px, 60vw)",
          maxWidth: "90vw",
          height: "auto",
          marginBottom: 48,
          marginTop: 20,
          display: "block",
          boxShadow: "0 4px 24px #0002",
          borderRadius: 18,
          background: "#fff",
          padding: 12,
        }}
      />
      <div style={{ display: "flex", gap: 40 }}>
        <button
          onClick={() => onSeleccion("fabrica")}
          style={{
            width: 120,
            height: 120,
            background: "#3949ab",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 2px 8px #bbb",
          }}
        >
          <FaIndustry size={48} style={{ marginBottom: 10 }} />
          Fábrica
        </button>
        <button
          onClick={() => onSeleccion("tienda")}
          style={{
            width: 120,
            height: 120,
            background: "#1a237e",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 2px 8px #bbb",
          }}
        >
          <FaCashRegister size={48} style={{ marginBottom: 10 }} />
          Tienda
        </button>
      </div>
    </div>
  );
}