import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Map, Layers, Target, Info } from 'lucide-react';
import { PTPN_LOCATION } from '../constants/ptpnConfig';
import { formatDistance } from '../utils/geoUtils';

export function AttendanceMap({
  userLat,
  userLng,
  distanceMeters,
  isWithinGeofence,
  allowedRadius,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inisialisasi peta Leaflet jika belum ada
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [PTPN_LOCATION.latitude, PTPN_LOCATION.longitude],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      // Light theme tiles yang sangat bersih: CartoDB Voyager
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    // 1. Lingkaran Geofence Radius Kantor PTPN IV Regional 3
    const geofenceCircle = L.circle([PTPN_LOCATION.latitude, PTPN_LOCATION.longitude], {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '5, 8',
      radius: allowedRadius,
    }).addTo(markersGroup);

    geofenceCircle.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
        <strong style="color: #1e40af;">Radius Resmi Absensi</strong><br/>
        Maksimal: ${allowedRadius} meter dari gerbang kantor.
      </div>
    `);

    // 2. Marker Kantor Direksi PTPN IV
    const officeIcon = L.divIcon({
      className: 'custom-office-pin',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 14px rgba(30, 58, 138, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 18px;
        ">
          🏢
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const officeMarker = L.marker([PTPN_LOCATION.latitude, PTPN_LOCATION.longitude], { icon: officeIcon }).addTo(markersGroup);
    officeMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; line-height: 1.4;">
        <strong style="color: #1e3a8a;">${PTPN_LOCATION.name}</strong><br/>
        ${PTPN_LOCATION.address}<br/>
        <span style="font-size: 11px; color: #64748b;">Titik Acuan Utama Presensi</span>
      </div>
    `);

    // 3. Marker Posisi Pengguna / Peserta Magang
    if (typeof userLat === 'number' && typeof userLng === 'number') {
      const userPinColor = isWithinGeofence ? '#2563eb' : '#dc2626';
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px;">
            <div style="
              position: absolute;
              inset: 0;
              background: ${userPinColor};
              border-radius: 50%;
              opacity: 0.35;
              animation: pulseDot 2s infinite;
            "></div>
            <div style="
              position: absolute;
              inset: 4px;
              background: ${userPinColor};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 10px ${userPinColor};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">
              👤
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(markersGroup);
      userMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <strong>Posisi Terkini Anda</strong><br/>
          Jarak ke Kantor: <strong>${formatDistance(distanceMeters)}</strong><br/>
          Status: <span style="color: ${isWithinGeofence ? '#1e40af' : '#dc2626'}; font-weight: bold;">
            ${isWithinGeofence ? 'Dalam Radius (Valid)' : 'Di Luar Radius'}
          </span>
        </div>
      `);

      // 4. Garis Penghubung (Polyline) Antara Pengguna dan Kantor
      const polyline = L.polyline(
        [
          [userLat, userLng],
          [PTPN_LOCATION.latitude, PTPN_LOCATION.longitude],
        ],
        {
          color: isWithinGeofence ? '#2563eb' : '#dc2626',
          weight: 2.5,
          dashArray: '6, 6',
          opacity: 0.85,
        }
      ).addTo(markersGroup);

      // Fit bounds agar kedua titik tampak jelas di layar
      const group = new L.featureGroup([officeMarker, userMarker, geofenceCircle]);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [userLat, userLng, distanceMeters, isWithinGeofence, allowedRadius]);

  // Tombol untuk memusatkan kembali peta ke kantor
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([PTPN_LOCATION.latitude, PTPN_LOCATION.longitude], 16);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Map size={20} color="#2563eb" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Peta Geofence Radius Kantor
          </h2>
        </div>

        <button
          onClick={handleRecenter}
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
        >
          <Target size={14} />
          <span>Pusatkan Kantor</span>
        </button>
      </div>

      {/* Map Display Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '360px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.05)',
        }}
      />

      {/* Map Legend */}
      <div style={{
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '0.78rem',
        color: '#64748b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1e3a8a', display: 'inline-block' }} />
            <span>Kantor PTPN IV Reg 3</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: isWithinGeofence ? '#2563eb' : '#dc2626', display: 'inline-block' }} />
            <span>Posisi Terkini Anda</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 8, borderRadius: 2, background: 'rgba(37, 99, 235, 0.15)', border: '1px dashed #2563eb', display: 'inline-block' }} />
            <span>Zona Radius ({allowedRadius}m)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569' }}>
          <Info size={13} />
          <span>Jl. Rambutan No. 43 Pekanbaru</span>
        </div>
      </div>
    </div>
  );
}
