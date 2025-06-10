import React, { useState } from "react";
import { FaIndustry, FaCashRegister, FaTools } from "react-icons/fa";
import logo from "../assets/logo1.png";
import Watermark from './Watermark';
import SupervisionPanel from './SupervisionPanel';

export default function SeleccionModo({ onSeleccion, pedidos, tiendas, onGestion }) {
  const [showSupervision, setShowSupervision] = useState(false);
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
      <Watermark />
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
          cursor: 'pointer',
          border: showSupervision ? '3px solid #007bff' : 'none',
          transition: 'border 0.2s'
        }}
        title="Panel de supervisión"
        onClick={() => setShowSupervision(true)}
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
        <button
          onClick={onGestion}
          style={{
            width: 120,
            height: 120,
            background: "#1976d2",
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
          <FaTools size={48} style={{ marginBottom: 10 }} />
          Gestión
        </button>
      </div>
      {showSupervision && (
        <SupervisionPanel pedidos={pedidos} tiendas={tiendas} onClose={()=>setShowSupervision(false)} />
      )}
    </div>
  );
}