import React, { useState } from "react";
import { FaIndustry, FaCashRegister, FaTools, FaTruck, FaBoxOpen, FaDollyFlatbed } from "react-icons/fa"; // Added FaDollyFlatbed
import logo from "../assets/logo1.png";
import Watermark from './Watermark';
import SupervisionPanel from './SupervisionPanel';
import AlmacenCentralPanel from './AlmacenCentralPanel';
import { useAppUpdates } from '../hooks/useAppUpdates';
import { ProductosProvider } from './ProductosContext';

export default function SeleccionModo({ onSeleccion, pedidos, tiendas, onGestion, onGestionEntradasFabrica, expedicionesClientes }) { // Added onGestionEntradasFabrica
  const [showSupervision, setShowSupervision] = useState(false);
  const { updateAvailable, forceUpdate } = useAppUpdates();
  const [showUpdateMsg, setShowUpdateMsg] = useState(false);
  const [showAlmacenCentral, setShowAlmacenCentral] = useState(false);

  React.useEffect(() => {
    if (updateAvailable) {
      setShowUpdateMsg(true);
      const timer = setTimeout(() => {
        setShowUpdateMsg(false);
        forceUpdate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateAvailable, forceUpdate]);

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
      {showUpdateMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1976d2',
          color: '#fff',
          padding: '16px 32px',
          borderRadius: 12,
          boxShadow: '0 2px 12px #0003',
          zIndex: 9999,
          fontSize: 20,
          fontWeight: 500,
        }}>
          ¡Nueva versión disponible! Actualizando la aplicación...
        </div>
      )}
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
      <div style={{ display: "flex", gap: 40, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
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
        <button
          onClick={expedicionesClientes}
          style={{
            width: 120,
            height: 120,
            background: "#00b894",
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
          <FaTruck size={48} style={{ marginBottom: 10 }} />
          Expediciones Clientes
        </button>
        <button
          onClick={() => setShowAlmacenCentral(true)}
          style={{
            width: 120,
            height: 120,
            background: "#ff9800",
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
            fontWeight: 600
          }}
        >
          <FaBoxOpen size={48} style={{ marginBottom: 10 }} />
          Almacén Central
        </button>
        <button
          onClick={onGestionEntradasFabrica} // Call the new prop
          style={{
            width: 120,
            height: 120,
            background: "#607d8b", // Example color
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
            textAlign: 'center'
          }}
        >
          <FaDollyFlatbed size={48} style={{ marginBottom: 10 }} />
          Entradas Fábrica
        </button>
      </div>
      {showSupervision && (
        <SupervisionPanel pedidos={pedidos} tiendas={tiendas} onClose={()=>setShowSupervision(false)} />
      )}
      {showAlmacenCentral && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',overflow:'auto'}}>
          <div style={{position:'relative',zIndex:10000, maxHeight:'95vh', overflowY:'auto', width:'min(1100px,95vw)'}}>
            <ProductosProvider>
              <AlmacenCentralPanel />
            </ProductosProvider>
            <button onClick={()=>setShowAlmacenCentral(false)} style={{position:'absolute',top:10,right:10,background:'#b71c1c',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:700,fontSize:16,cursor:'pointer',zIndex:10001}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}