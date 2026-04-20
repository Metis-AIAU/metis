import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MousePointer2, Link2, Trash2, RotateCcw, ImagePlus, X, Info, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Protocol definitions ────────────────────────────────────────────────────
export const PROTOCOLS = {
  HTTPS:   { label: 'HTTPS',   color: '#10b981' },
  HTTP:    { label: 'HTTP',    color: '#f59e0b' },
  TCP:     { label: 'TCP',     color: '#3b82f6' },
  SSH:     { label: 'SSH',     color: '#8b5cf6' },
  UDP:     { label: 'UDP',     color: '#06b6d4' },
  MQTT:    { label: 'MQTT',    color: '#ec4899' },
  Modbus:  { label: 'Modbus',  color: '#ef4444' },
  DNP3:    { label: 'DNP3',    color: '#f97316' },
  ICMP:    { label: 'ICMP',    color: '#84cc16' },
  Custom:  { label: 'Custom',  color: '#94a3b8' },
};

// ─── Element type definitions ────────────────────────────────────────────────
export const ELEMENT_DEFS = {
  // People & Actors
  user:           { label: 'User',          color: '#3b82f6', bg: '#dbeafe', w: 80,  h: 90,  desc: 'End user or client',             category: 'people'   },
  admin:          { label: 'Admin',         color: '#1d4ed8', bg: '#bfdbfe', w: 80,  h: 90,  desc: 'System administrator',            category: 'people'   },
  attacker:       { label: 'Attacker',      color: '#dc2626', bg: '#fee2e2', w: 80,  h: 90,  desc: 'Threat actor / adversary',        category: 'people'   },
  external_actor: { label: 'External',      color: '#6b7280', bg: '#f3f4f6', w: 100, h: 60,  desc: 'External party or organisation',  category: 'people'   },
  // Servers
  web_server:     { label: 'Web Server',    color: '#0891b2', bg: '#cffafe', w: 120, h: 70,  desc: 'HTTP/HTTPS web server',           category: 'servers'  },
  app_server:     { label: 'App Server',    color: '#7c3aed', bg: '#ede9fe', w: 120, h: 70,  desc: 'Application / middleware server', category: 'servers'  },
  db_server:      { label: 'DB Server',     color: '#d97706', bg: '#fef3c7', w: 110, h: 75,  desc: 'Database server',                 category: 'servers'  },
  file_server:    { label: 'File Server',   color: '#059669', bg: '#d1fae5', w: 120, h: 70,  desc: 'File storage server',             category: 'servers'  },
  mail_server:    { label: 'Mail Server',   color: '#db2777', bg: '#fce7f3', w: 120, h: 70,  desc: 'Email server (SMTP/IMAP)',         category: 'servers'  },
  // Network Devices
  firewall:       { label: 'Firewall',      color: '#dc2626', bg: '#fee2e2', w: 110, h: 65,  desc: 'Network firewall',                category: 'network'  },
  router:         { label: 'Router',        color: '#2563eb', bg: '#dbeafe', w: 80,  h: 80,  desc: 'Network router',                  category: 'network'  },
  switch:         { label: 'Switch',        color: '#0d9488', bg: '#ccfbf1', w: 120, h: 60,  desc: 'Network switch',                  category: 'network'  },
  load_balancer:  { label: 'Load Balancer', color: '#7c3aed', bg: '#ede9fe', w: 130, h: 60,  desc: 'Traffic load balancer',           category: 'network'  },
  vpn_gateway:    { label: 'VPN Gateway',   color: '#065f46', bg: '#d1fae5', w: 130, h: 65,  desc: 'VPN gateway / tunnel endpoint',   category: 'network'  },
  ids_ips:        { label: 'IDS/IPS',       color: '#7f1d1d', bg: '#fecaca', w: 110, h: 60,  desc: 'Intrusion detection/prevention',  category: 'network'  },
  // Data Stores
  database:       { label: 'Database',      color: '#b45309', bg: '#fef3c7', w: 100, h: 70,  desc: 'Relational / NoSQL database',     category: 'storage'  },
  cache:          { label: 'Cache',         color: '#0891b2', bg: '#cffafe', w: 100, h: 60,  desc: 'In-memory cache (Redis etc.)',    category: 'storage'  },
  file_store:     { label: 'File Store',    color: '#6d28d9', bg: '#ede9fe', w: 100, h: 65,  desc: 'File / object storage',           category: 'storage'  },
  cloud_storage:  { label: 'Cloud Storage', color: '#0369a1', bg: '#e0f2fe', w: 130, h: 65,  desc: 'Cloud storage (S3, Blob…)',       category: 'storage'  },
  // Services & Apps
  api_service:    { label: 'API Service',   color: '#7c3aed', bg: '#ede9fe', w: 120, h: 60,  desc: 'REST / GraphQL API endpoint',     category: 'services' },
  microservice:   { label: 'Microservice',  color: '#1d4ed8', bg: '#dbeafe', w: 110, h: 65,  desc: 'Microservice / container',        category: 'services' },
  cloud_service:  { label: 'Cloud Service', color: '#0284c7', bg: '#e0f2fe', w: 130, h: 65,  desc: 'Cloud-hosted service (SaaS)',     category: 'services' },
  mobile_app:     { label: 'Mobile App',    color: '#059669', bg: '#d1fae5', w: 65,  h: 100, desc: 'Mobile application',              category: 'services' },
  web_app:        { label: 'Web App',       color: '#2563eb', bg: '#dbeafe', w: 130, h: 65,  desc: 'Web application / browser client',category: 'services' },
  // Zones (rendered as large containers)
  internet_zone:  { label: 'Internet',      color: '#dc2626', bg: 'rgba(254,242,242,0.45)', w: 320, h: 240, desc: 'Public internet zone',       category: 'zones' },
  dmz_zone:       { label: 'DMZ',           color: '#ea580c', bg: 'rgba(255,237,213,0.45)', w: 320, h: 240, desc: 'Demilitarised zone',          category: 'zones' },
  corporate_lan:  { label: 'Corporate LAN', color: '#16a34a', bg: 'rgba(220,252,231,0.45)', w: 320, h: 240, desc: 'Internal corporate network',  category: 'zones' },
  ot_ics_zone:    { label: 'OT / ICS Zone', color: '#d97706', bg: 'rgba(254,243,199,0.45)', w: 320, h: 240, desc: 'Operational technology net',  category: 'zones' },
  cloud_zone:     { label: 'Cloud Zone',    color: '#0284c7', bg: 'rgba(224,242,254,0.45)', w: 320, h: 240, desc: 'Cloud infrastructure zone',   category: 'zones' },
  secure_zone:    { label: 'Secure Zone',   color: '#0f766e', bg: 'rgba(204,251,241,0.45)', w: 320, h: 240, desc: 'High-security enclave',       category: 'zones' },
};

export const CATEGORIES = [
  { id: 'people',   label: 'People',       types: ['user','admin','attacker','external_actor'] },
  { id: 'servers',  label: 'Servers',      types: ['web_server','app_server','db_server','file_server','mail_server'] },
  { id: 'network',  label: 'Network',      types: ['firewall','router','switch','load_balancer','vpn_gateway','ids_ips'] },
  { id: 'storage',  label: 'Data Stores',  types: ['database','cache','file_store','cloud_storage'] },
  { id: 'services', label: 'Services',     types: ['api_service','microservice','cloud_service','mobile_app','web_app'] },
  { id: 'zones',    label: 'Zones',        types: ['internet_zone','dmz_zone','corporate_lan','ot_ics_zone','cloud_zone','secure_zone'] },
];

const ZONE_TYPES = new Set(['internet_zone','dmz_zone','corporate_lan','ot_ics_zone','cloud_zone','secure_zone']);

// ─── Arrow marker colours ─────────────────────────────────────────────────────
const MARKER_DEFS = [
  { id: 'def',   color: '#94a3b8' },
  { id: 'sel',   color: '#2563eb' },
  { id: 'conn',  color: '#8b5cf6' },
  { id: 'https', color: '#10b981' },
  { id: 'http',  color: '#f59e0b' },
  { id: 'tcp',   color: '#3b82f6' },
  { id: 'ssh',   color: '#8b5cf6' },
  { id: 'udp',   color: '#06b6d4' },
  { id: 'mqtt',  color: '#ec4899' },
  { id: 'modbus',color: '#ef4444' },
  { id: 'dnp3',  color: '#f97316' },
  { id: 'icmp',  color: '#84cc16' },
  { id: 'custom',color: '#94a3b8' },
];

function markerId(proto) {
  if (!proto) return 'def';
  return proto.toLowerCase().replace(/[^a-z0-9]/g,'');
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function getEdgePoint(el, targetX, targetY) {
  const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
  const dx = targetX - cx, dy = targetY - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const hw = el.w / 2, hh = el.h / 2;
  if (Math.abs(dy) * hw <= Math.abs(dx) * hh) {
    const sign = dx > 0 ? 1 : -1;
    return { x: cx + sign * hw, y: cy + (dy * hw) / Math.abs(dx) };
  }
  const sign = dy > 0 ? 1 : -1;
  return { x: cx + (dx * hh) / Math.abs(dy), y: cy + sign * hh };
}

function connectionPath(from, to) {
  const fp = getEdgePoint(from, to.x + to.w / 2, to.y + to.h / 2);
  const tp = getEdgePoint(to, from.x + from.w / 2, from.y + from.h / 2);
  const mx = (fp.x + tp.x) / 2;
  const dist = Math.hypot(tp.x - fp.x, tp.y - fp.y);
  const my = (fp.y + tp.y) / 2 - Math.min(dist * 0.15, 40);
  return { d: `M ${fp.x} ${fp.y} Q ${mx} ${my} ${tp.x} ${tp.y}`, mid: { x: mx, y: my - 6 }, fp, tp };
}

// ─── Shape body renderers (SVG, no interaction wrappers) ──────────────────────
function renderShape(el, sw, isSelected) {
  const { color, bg } = ELEMENT_DEFS[el.type] || { color: '#6b7280', bg: '#f3f4f6' };
  const { x, y, w, h } = el;
  const cx = x + w / 2, cy = y + h / 2;

  // Stick-figure helper
  const stickFigure = (accent) => (
    <>
      <circle cx={cx} cy={y + 16} r={13} fill={bg} stroke={accent || color} strokeWidth={sw} />
      <line x1={cx} y1={y+29} x2={cx} y2={y+55} stroke={accent || color} strokeWidth={sw} />
      <line x1={cx-16} y1={y+42} x2={cx+16} y2={y+42} stroke={accent || color} strokeWidth={sw} />
      <line x1={cx} y1={y+55} x2={cx-12} y2={y+78} stroke={accent || color} strokeWidth={sw} />
      <line x1={cx} y1={y+55} x2={cx+12} y2={y+78} stroke={accent || color} strokeWidth={sw} />
    </>
  );

  // Server box helper
  const serverBox = (iconFn) => (
    <>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} stroke={color} strokeWidth={sw} />
      <rect x={x} y={y} width={w} height={16} rx={4} fill={color} opacity={0.15} />
      <circle cx={x+10} cy={y+8} r={3} fill={color} opacity={0.6} />
      <circle cx={x+20} cy={y+8} r={3} fill={color} opacity={0.4} />
      {iconFn && iconFn()}
    </>
  );

  // Cylinder helper
  const cylinder = (label) => {
    const ry = 8, bodyY = y + ry;
    return (
      <>
        <rect x={x} y={bodyY} width={w} height={h - ry*2} fill={bg} stroke={color} strokeWidth={sw} />
        <ellipse cx={cx} cy={bodyY} rx={w/2} ry={ry} fill={bg} stroke={color} strokeWidth={sw} />
        <ellipse cx={cx} cy={y+h-ry} rx={w/2} ry={ry} fill={bg} stroke={color} strokeWidth={sw} />
        {label && <text x={cx} y={cy+4} textAnchor="middle" fontSize={10} fill={color} fontWeight="700">{label}</text>}
      </>
    );
  };

  switch (el.type) {
    // ── People ──
    case 'user':
      return stickFigure(color);
    case 'admin':
      return (
        <>
          {stickFigure(color)}
          {/* key badge */}
          <rect x={cx+2} y={y+12} width={14} height={9} rx={2} fill={color} opacity={0.85} />
          <text x={cx+9} y={y+20} textAnchor="middle" fontSize={7} fill="white" fontWeight="700">★</text>
        </>
      );
    case 'attacker':
      return (
        <>
          {stickFigure(color)}
          {/* hood triangle */}
          <polygon points={`${cx},${y+2} ${cx-15},${y+28} ${cx+15},${y+28}`}
            fill={bg} stroke={color} strokeWidth={sw} opacity={0.9} />
        </>
      );
    case 'external_actor':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} fill={bg} stroke={color} strokeWidth={sw} />
          <rect x={x+5} y={y+5} width={w-10} height={h-10} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
        </>
      );

    // ── Servers ──
    case 'web_server':
      return serverBox(() => (
        <>
          <circle cx={cx} cy={y+h/2+4} r={14} fill="none" stroke={color} strokeWidth={1.2} opacity={0.5} />
          <line x1={cx-14} y1={y+h/2+4} x2={cx+14} y2={y+h/2+4} stroke={color} strokeWidth={1} opacity={0.4} />
          <ellipse cx={cx} cy={y+h/2+4} rx={7} ry={14} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
        </>
      ));
    case 'app_server':
      return serverBox(() => (
        <>
          <rect x={x+8} y={y+24} width={w-16} height={6} rx={2} fill={color} opacity={0.2} />
          <rect x={x+8} y={y+34} width={w-16} height={6} rx={2} fill={color} opacity={0.2} />
          <rect x={x+8} y={y+44} width={(w-16)*0.7} height={6} rx={2} fill={color} opacity={0.2} />
        </>
      ));
    case 'db_server':
      return (
        <>
          {cylinder()}
          <rect x={x} y={y} width={w} height={16} rx={4} fill={color} opacity={0.15} />
          <circle cx={x+10} cy={y+8} r={3} fill={color} opacity={0.6} />
        </>
      );
    case 'file_server':
      return serverBox(() => (
        <>
          <rect x={cx-14} y={y+26} width={28} height={20} rx={2} fill="none" stroke={color} strokeWidth={1.2} opacity={0.5} />
          <path d={`M ${cx-14} ${y+26} L ${cx-14} ${y+22} L ${cx-6} ${y+22} L ${cx-2} ${y+26}`} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
        </>
      ));
    case 'mail_server':
      return serverBox(() => (
        <>
          <rect x={cx-16} y={y+24} width={32} height={20} rx={2} fill="none" stroke={color} strokeWidth={1.2} opacity={0.5} />
          <polyline points={`${cx-16},${y+24} ${cx},${y+36} ${cx+16},${y+24}`} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
        </>
      ));

    // ── Network ──
    case 'firewall': {
      const brickW = 20, brickH = 10;
      const bricks = [];
      for (let row = 0; row < 3; row++) {
        const offset = row % 2 === 0 ? 0 : brickW / 2;
        for (let col = 0; col < 3; col++) {
          const bx = x + 8 + col * brickW - offset;
          const by = y + 12 + row * brickH;
          if (bx + brickW > x + w - 5 || bx < x + 5) continue;
          bricks.push(<rect key={`${row}-${col}`} x={bx} y={by} width={brickW-2} height={brickH-2} rx={1} fill={color} opacity={0.18} stroke={color} strokeWidth={0.5} opacity2={0.3} />);
        }
      }
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} stroke={color} strokeWidth={sw} />
          {bricks}
        </>
      );
    }
    case 'router': {
      const r = Math.min(w, h) / 2 - 4;
      return (
        <>
          <circle cx={cx} cy={cy} r={r} fill={bg} stroke={color} strokeWidth={sw} />
          <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke={color} strokeWidth={1.2} opacity={0.6} />
          <line x1={cx} y1={cy-r} x2={cx} y2={cy+r} stroke={color} strokeWidth={1.2} opacity={0.6} />
          <circle cx={cx-r-5} cy={cy} r={4} fill={color} opacity={0.5} />
          <circle cx={cx+r+5} cy={cy} r={4} fill={color} opacity={0.5} />
          <circle cx={cx} cy={cy-r-5} r={4} fill={color} opacity={0.5} />
          <circle cx={cx} cy={cy+r+5} r={4} fill={color} opacity={0.5} />
          <circle cx={cx} cy={cy} r={5} fill={color} opacity={0.7} />
        </>
      );
    }
    case 'switch':
      return (
        <>
          <rect x={x} y={y+10} width={w} height={h-20} rx={4} fill={bg} stroke={color} strokeWidth={sw} />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={x+8+i*13} y={y+h-10} width={9} height={8} rx={1} fill={color} opacity={0.4} />
          ))}
          <rect x={x} y={y+10} width={w} height={12} rx={4} fill={color} opacity={0.12} />
        </>
      );
    case 'load_balancer':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} stroke={color} strokeWidth={sw} />
          {/* funnel lines */}
          <line x1={cx-30} y1={y+14} x2={cx} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.5} />
          <line x1={cx+30} y1={y+14} x2={cx} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.5} />
          <line x1={cx} y1={cy} x2={cx-22} y2={y+h-14} stroke={color} strokeWidth={1.5} opacity={0.5} />
          <line x1={cx} y1={cy} x2={cx+22} y2={y+h-14} stroke={color} strokeWidth={1.5} opacity={0.5} />
          <circle cx={cx} cy={cy} r={5} fill={color} opacity={0.6} />
        </>
      );
    case 'vpn_gateway':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} stroke={color} strokeWidth={sw} />
          {/* lock icon */}
          <rect x={cx-10} y={cy-2} width={20} height={14} rx={3} fill={color} opacity={0.25} stroke={color} strokeWidth={1} />
          <path d={`M ${cx-7} ${cy-2} Q ${cx-7} ${cy-14} ${cx} ${cy-14} Q ${cx+7} ${cy-14} ${cx+7} ${cy-2}`}
            fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
          <circle cx={cx} cy={cy+5} r={3} fill={color} opacity={0.7} />
        </>
      );
    case 'ids_ips':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} stroke={color} strokeWidth={sw} />
          {/* eye icon */}
          <path d={`M ${x+12} ${cy} Q ${cx} ${cy-14} ${x+w-12} ${cy} Q ${cx} ${cy+14} ${x+12} ${cy}`}
            fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
          <circle cx={cx} cy={cy} r={6} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
          <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.5} />
        </>
      );

    // ── Data Stores ──
    case 'database':
      return cylinder();
    case 'cache':
      return (
        <>
          {cylinder()}
          <text x={cx} y={cy+5} textAnchor="middle" fontSize={14} fill={color} opacity={0.5}>⚡</text>
        </>
      );
    case 'file_store': {
      const pages = [
        { dx: 6, dy: 4 },
        { dx: 3, dy: 2 },
        { dx: 0, dy: 0 },
      ];
      return (
        <>
          {pages.map((p, i) => (
            <rect key={i} x={x+15+p.dx} y={y+12+p.dy} width={w-30} height={h-24} rx={2}
              fill={i === 2 ? bg : 'white'} stroke={color} strokeWidth={i === 2 ? sw : 0.8} opacity={0.7+i*0.15} />
          ))}
          <line x1={x+20} y1={y+25} x2={x+w-20} y2={y+25} stroke={color} strokeWidth={1} opacity={0.4} />
          <line x1={x+20} y1={y+33} x2={x+w-20} y2={y+33} stroke={color} strokeWidth={1} opacity={0.4} />
        </>
      );
    }
    case 'cloud_storage': {
      const cloudCx = cx, cloudCy = cy - 4;
      return (
        <>
          <path d={`M ${cloudCx-45} ${cloudCy+16}
            Q ${cloudCx-45} ${cloudCy-8} ${cloudCx-22} ${cloudCy-8}
            Q ${cloudCx-18} ${cloudCy-22} ${cloudCx} ${cloudCy-22}
            Q ${cloudCx+18} ${cloudCy-22} ${cloudCx+22} ${cloudCy-8}
            Q ${cloudCx+45} ${cloudCy-8} ${cloudCx+45} ${cloudCy+16} Z`}
            fill={bg} stroke={color} strokeWidth={sw} />
          {/* cylinder at bottom */}
          <ellipse cx={cloudCx} cy={cloudCy+16} rx={22} ry={6} fill={bg} stroke={color} strokeWidth={1} />
          <line x1={cloudCx-22} y1={cloudCy+16} x2={cloudCx-22} y2={cloudCy+26} stroke={color} strokeWidth={1} />
          <line x1={cloudCx+22} y1={cloudCy+16} x2={cloudCx+22} y2={cloudCy+26} stroke={color} strokeWidth={1} />
          <ellipse cx={cloudCx} cy={cloudCy+26} rx={22} ry={6} fill={bg} stroke={color} strokeWidth={1} />
        </>
      );
    }

    // ── Services ──
    case 'api_service':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={6} fill={bg} stroke={color} strokeWidth={sw} />
          <text x={cx} y={cy+5} textAnchor="middle" fontSize={13} fill={color} fontWeight="700" fontFamily="monospace">{'</>'}</text>
        </>
      );
    case 'microservice': {
      const hs = Math.min(w,h) / 2 - 2;
      const hex = `${cx},${y+4} ${cx+hs},${cy-hs/2+4} ${cx+hs},${cy+hs/2-4} ${cx},${y+h-4} ${cx-hs},${cy+hs/2-4} ${cx-hs},${cy-hs/2+4}`;
      return (
        <>
          <polygon points={hex} fill={bg} stroke={color} strokeWidth={sw} />
        </>
      );
    }
    case 'cloud_service': {
      const ccx = cx, ccy = cy;
      return (
        <>
          <path d={`M ${ccx-52} ${ccy+12}
            Q ${ccx-52} ${ccy-10} ${ccx-28} ${ccy-10}
            Q ${ccx-22} ${ccy-24} ${ccx} ${ccy-24}
            Q ${ccx+22} ${ccy-24} ${ccx+28} ${ccy-10}
            Q ${ccx+52} ${ccy-10} ${ccx+52} ${ccy+12} Z`}
            fill={bg} stroke={color} strokeWidth={sw} />
          <rect x={x+10} y={ccy+12} width={w-20} height={10} rx={3} fill={bg} stroke={color} strokeWidth={0.8} opacity={0.6} />
        </>
      );
    }
    case 'mobile_app': {
      const mw = 40, mh = 72, mx = cx - mw/2, my = y + (h-mh)/2;
      return (
        <>
          <rect x={mx} y={my} width={mw} height={mh} rx={8} fill={bg} stroke={color} strokeWidth={sw} />
          <rect x={mx+4} y={my+8} width={mw-8} height={mh-24} rx={3} fill={color} opacity={0.08} />
          <rect x={mx+12} y={my+mh-10} width={16} height={5} rx={2} fill={color} opacity={0.4} />
          <line x1={mx+14} y1={my+5} x2={mx+mw-14} y2={my+5} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
        </>
      );
    }
    case 'web_app': {
      const tabH = 14;
      return (
        <>
          <rect x={x} y={y+tabH} width={w} height={h-tabH} rx={4} fill={bg} stroke={color} strokeWidth={sw} />
          <rect x={x} y={y+tabH} width={w} height={12} fill={color} opacity={0.1} />
          <circle cx={x+10} cy={y+tabH+6} r={3} fill={color} opacity={0.5} />
          <circle cx={x+20} cy={y+tabH+6} r={3} fill={color} opacity={0.35} />
          <circle cx={x+30} cy={y+tabH+6} r={3} fill={color} opacity={0.25} />
          <rect x={x+4} y={y+tabH} width={40} height={tabH} rx={3} fill={color} opacity={0.15} />
          {/* address bar */}
          <rect x={x+48} y={y+tabH+4} width={w-56} height={6} rx={3} fill={color} opacity={0.1} />
        </>
      );
    }

    // ── Zones ──
    default:
      // All zone types and any unrecognised type
      return (
        <>
          <rect x={x} y={y} width={w} height={h} rx={8}
            fill={ELEMENT_DEFS[el.type]?.bg ?? 'rgba(243,244,246,0.4)'}
            stroke={ELEMENT_DEFS[el.type]?.color ?? '#6b7280'}
            strokeWidth={isSelected ? 2.5 : 2}
            strokeDasharray="10,6" />
        </>
      );
  }
}

// ─── Anchor point positions (top, right, bottom, left) ───────────────────────
function getAnchorPoints(el) {
  const { x, y, w, h } = el;
  return [
    { id: 'top',    cx: x + w / 2, cy: y },
    { id: 'right',  cx: x + w,     cy: y + h / 2 },
    { id: 'bottom', cx: x + w / 2, cy: y + h },
    { id: 'left',   cx: x,         cy: y + h / 2 },
  ];
}

// ─── Shape component (interaction wrapper) ────────────────────────────────────
function Shape({ el, isSelected, isConnecting, isDragTarget, tool, isDragging, onMouseDown, onDblClick, onConnectClick, onAnchorDown, onMouseUp, onDrop, onDragOver, editingId, editLabel, onEditChange, onEditCommit }) {
  const def = ELEMENT_DEFS[el.type] || { color: '#6b7280', label: el.type };
  const isZone = ZONE_TYPES.has(el.type);
  const cursor = tool === 'connect' ? 'crosshair' : 'move';
  const sw = isSelected ? 2.5 : 1.5;
  const { x, y, w, h } = el;
  const cx = x + w / 2;

  const handleDown  = (e) => { e.stopPropagation(); onMouseDown(e, el.id); };
  const handleDbl   = (e) => { e.stopPropagation(); onDblClick(e, el.id); };
  const handleClick = (e) => { e.stopPropagation(); if (tool === 'connect') onConnectClick(el.id); };
  // DO NOT stopPropagation — onSVGMouseUp must always fire to clear dragging
  const handleUp    = () => { onMouseUp(el.id); };

  // Label position
  const isStickFigure = ['user','admin','attacker'].includes(el.type);
  const labelY = isStickFigure ? y + h - 2 : (isZone ? y + 18 : y + h + 14);
  const labelAnchor = isZone ? 'start' : 'middle';
  const labelX = isZone ? x + 10 : cx;

  const labelEl = editingId === el.id ? (
    <foreignObject x={x} y={isZone ? y + 4 : y + h + 2} width={isZone ? w * 0.6 : w} height={24}>
      <input
        style={{ width: '100%', textAlign: isZone ? 'left' : 'center', border: '1px solid #3b82f6',
          borderRadius: 4, padding: '2px 6px', fontSize: isZone ? 11 : 12, outline: 'none',
          fontWeight: 700, color: def.color, background: 'white' }}
        value={editLabel}
        onChange={onEditChange}
        onBlur={onEditCommit}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); }}
        autoFocus
      />
    </foreignObject>
  ) : null;

  // Show anchors via CSS hover (class-based, no React state) — hide while dragging elements
  const showAnchorsClass = !isZone && !isDragging ? 'shape-group' : '';
  const anchors = getAnchorPoints(el);

  return (
    <g className={showAnchorsClass} onMouseDown={handleDown} onDoubleClick={handleDbl} onClick={handleClick}
       onMouseUp={handleUp} style={{ cursor }}
       onDragOver={onDragOver} onDrop={onDrop}>
      {/* Selection box */}
      {isSelected && !isZone && (
        <rect x={x-5} y={y-5} width={w+10} height={h+10} rx={6}
          fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.8} />
      )}
      {/* Connect hover highlight / drag target highlight */}
      {(isConnecting || isDragTarget) && (
        <rect x={x-8} y={y-8} width={w+16} height={h+16} rx={8}
          fill={isDragTarget ? '#10b981' : '#8b5cf6'} opacity={0.12} />
      )}
      {/* Shape body */}
      {renderShape(el, sw, isSelected)}
      {/* Label */}
      {editingId !== el.id && (
        <text x={labelX} y={labelY} textAnchor={labelAnchor}
          fontSize={isZone ? 11 : 11}
          fill={isZone ? def.color : '#374151'}
          fontWeight={isZone ? 700 : 600}
          fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
          letterSpacing={isZone ? '0.02em' : '0'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {el.label}
        </text>
      )}
      {labelEl}
      {/* Connection anchor points — visible via CSS :hover on .shape-group */}
      {!isZone && (
        <g className="shape-anchors" style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
          {anchors.map((a) => (
            <g key={a.id}>
              {/* Hit area — sized to not overlap element body */}
              <circle cx={a.cx} cy={a.cy} r={7} fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseDown={(e) => { e.stopPropagation(); onAnchorDown(e, el.id, a.id); }}
              />
              {/* Visible anchor dot */}
              <circle cx={a.cx} cy={a.cy} r={4.5} fill="white" stroke="#8b5cf6" strokeWidth={1.5}
                style={{ pointerEvents: 'none' }}
              />
              {/* Inner dot */}
              <circle cx={a.cx} cy={a.cy} r={1.5} fill="#8b5cf6"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

// ─── Palette mini-icon ─────────────────────────────────────────────────────────
function PaletteIcon({ type, color, bg }) {
  const W = 38, H = 28;
  const cx = W / 2, cy = H / 2;

  const stickPalette = () => (
    <svg width={22} height={32} viewBox="0 0 22 32">
      <circle cx={11} cy={7} r={6} fill={bg} stroke={color} strokeWidth={1.5} />
      <line x1={11} y1={13} x2={11} y2={24} stroke={color} strokeWidth={1.5} />
      <line x1={4}  y1={19} x2={18} y2={19} stroke={color} strokeWidth={1.5} />
      <line x1={11} y1={24} x2={5}  y2={32} stroke={color} strokeWidth={1.5} />
      <line x1={11} y1={24} x2={17} y2={32} stroke={color} strokeWidth={1.5} />
    </svg>
  );

  const serverPalette = () => (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={1} y={1} width={W-2} height={H-2} rx={3} fill={bg} stroke={color} strokeWidth={1.5} />
      <rect x={1} y={1} width={W-2} height={8}   rx={3} fill={color} opacity={0.2} />
      <circle cx={6} cy={5} r={2} fill={color} opacity={0.7} />
      <circle cx={13} cy={5} r={2} fill={color} opacity={0.5} />
    </svg>
  );

  const cylinderPalette = () => (
    <svg width={W} height={H+4} viewBox={`0 0 ${W} ${H+4}`}>
      <rect x={4} y={5} width={W-8} height={H-6} fill={bg} stroke={color} strokeWidth={1.5} />
      <ellipse cx={W/2} cy={5} rx={(W-8)/2} ry={5} fill={bg} stroke={color} strokeWidth={1.5} />
      <ellipse cx={W/2} cy={H-1} rx={(W-8)/2} ry={5} fill={bg} stroke={color} strokeWidth={1.5} />
    </svg>
  );

  switch (type) {
    case 'user': case 'admin': case 'attacker': return stickPalette();
    case 'external_actor':
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={1} y={1} width={W-2} height={H-2} fill={bg} stroke={color} strokeWidth={1.5} />
        <rect x={4} y={4} width={W-8} height={H-8} fill="none" stroke={color} strokeWidth={1} opacity={0.6} />
      </svg>;
    case 'web_server': case 'app_server': case 'file_server': case 'mail_server': case 'db_server':
    case 'ids_ips': case 'vpn_gateway':
      return serverPalette();
    case 'database': case 'cache': case 'file_store':
      return cylinderPalette();
    case 'cloud_storage': case 'cloud_service': {
      const ccx = W/2, ccy = H/2 - 2;
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={`M ${ccx-16} ${ccy+8} Q ${ccx-16} ${ccy-2} ${ccx-8} ${ccy-2}
          Q ${ccx-5} ${ccy-9} ${ccx} ${ccy-9} Q ${ccx+5} ${ccy-9} ${ccx+8} ${ccy-2}
          Q ${ccx+16} ${ccy-2} ${ccx+16} ${ccy+8} Z`}
          fill={bg} stroke={color} strokeWidth={1.5} />
      </svg>;
    }
    case 'firewall':
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={1} y={1} width={W-2} height={H-2} rx={3} fill={bg} stroke={color} strokeWidth={1.5} />
        {[0,1,2].map(row => [0,1].map(col => (
          <rect key={`${row}${col}`} x={4+col*17+(row%2)*8} y={4+row*7} width={14} height={5} rx={1}
            fill={color} opacity={0.2} stroke={color} strokeWidth={0.5} />
        )))}
      </svg>;
    case 'router': {
      const r = Math.min(W,H)/2 - 3;
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={cx} cy={cy} r={r} fill={bg} stroke={color} strokeWidth={1.5} />
        <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke={color} strokeWidth={1} opacity={0.6} />
        <line x1={cx} y1={cy-r} x2={cx} y2={cy+r} stroke={color} strokeWidth={1} opacity={0.6} />
      </svg>;
    }
    case 'switch':
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={1} y={4} width={W-2} height={H-8} rx={3} fill={bg} stroke={color} strokeWidth={1.5} />
        {[0,1,2,3,4].map(i => <rect key={i} x={4+i*7} y={H-6} width={5} height={5} rx={1} fill={color} opacity={0.4} />)}
      </svg>;
    case 'load_balancer':
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={1} y={1} width={W-2} height={H-2} rx={3} fill={bg} stroke={color} strokeWidth={1.5} />
        <line x1={cx-12} y1={6} x2={cx} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.6} />
        <line x1={cx+12} y1={6} x2={cx} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.6} />
        <line x1={cx} y1={cy} x2={cx-10} y2={H-4} stroke={color} strokeWidth={1.5} opacity={0.6} />
        <line x1={cx} y1={cy} x2={cx+10} y2={H-4} stroke={color} strokeWidth={1.5} opacity={0.6} />
      </svg>;
    case 'api_service':
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={1} y={1} width={W-2} height={H-2} rx={5} fill={bg} stroke={color} strokeWidth={1.5} />
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={11} fill={color} fontWeight="700" fontFamily="monospace">{'</>'}</text>
      </svg>;
    case 'microservice': {
      const hs = Math.min(W,H)/2-2;
      const hex = `${cx},${2} ${cx+hs},${cy-hs/2+2} ${cx+hs},${cy+hs/2-2} ${cx},${H-2} ${cx-hs},${cy+hs/2-2} ${cx-hs},${cy-hs/2+2}`;
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polygon points={hex} fill={bg} stroke={color} strokeWidth={1.5} />
      </svg>;
    }
    case 'mobile_app':
      return <svg width={22} height={32} viewBox="0 0 22 32">
        <rect x={1} y={1} width={20} height={30} rx={4} fill={bg} stroke={color} strokeWidth={1.5} />
        <rect x={4} y={5} width={14} height={18} rx={2} fill={color} opacity={0.1} />
        <rect x={7} y={27} width={8} height={3} rx={1} fill={color} opacity={0.4} />
      </svg>;
    case 'web_app':
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={1} y={6} width={W-2} height={H-7} rx={3} fill={bg} stroke={color} strokeWidth={1.5} />
        <rect x={1} y={6} width={W-2} height={8} fill={color} opacity={0.1} />
        <circle cx={6}  cy={10} r={2} fill={color} opacity={0.5} />
        <circle cx={12} cy={10} r={2} fill={color} opacity={0.35} />
        <rect x={1} y={1} width={22} height={8} rx={3} fill={bg} stroke={color} strokeWidth={1} opacity={0.7} />
      </svg>;
    default: // zones
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={1} y={1} width={W-2} height={H-2} rx={4}
          fill={bg} stroke={color} strokeWidth={1.5} strokeDasharray="6,3" />
      </svg>;
  }
}

// ─── Connection edit panel ─────────────────────────────────────────────────────
function ConnectionPanel({ conn, position, svgRect, onUpdate, onDelete, onClose }) {
  if (!conn || !position || !svgRect) return null;
  const left = svgRect.left + position.x;
  const top  = svgRect.top  + position.y - 110;

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-64"
      style={{ left: Math.min(left, window.innerWidth - 270), top: Math.max(top, 8) }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-widest">Connection</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>

      {/* Label */}
      <div className="mb-3">
        <label className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase tracking-widest">Label</label>
        <input
          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 placeholder-gray-300"
          value={conn.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="e.g. login request"
        />
      </div>

      {/* Protocol */}
      <div className="mb-3">
        <label className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase tracking-widest">Protocol</label>
        <div className="flex flex-wrap gap-1">
          {Object.entries(PROTOCOLS).map(([key, proto]) => (
            <button
              key={key}
              onClick={() => onUpdate({ protocol: key })}
              className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-medium border transition-all ${
                (conn.protocol || 'Custom') === key
                  ? 'text-white border-transparent shadow'
                  : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'
              }`}
              style={(conn.protocol || 'Custom') === key ? { background: proto.color, borderColor: proto.color } : {}}
            >{proto.label}</button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div className="mb-3">
        <label className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase tracking-widest">Direction</label>
        <div className="flex gap-1">
          {[
            { val: 'forward',       label: '→',  title: 'Forward' },
            { val: 'backward',      label: '←',  title: 'Backward' },
            { val: 'bidirectional', label: '↔',  title: 'Bidirectional' },
          ].map(({ val, label, title }) => (
            <button key={val} title={title}
              onClick={() => onUpdate({ direction: val })}
              className={`flex-1 py-1 text-sm rounded-lg border font-bold transition-all ${
                (conn.direction || 'forward') === val
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 border-gray-200 hover:border-gray-400 bg-white'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors tracking-wider uppercase"
      >
        <Trash2 className="w-3 h-3" />Delete connection
      </button>
    </div>
  );
}

// ─── Main canvas component ────────────────────────────────────────────────────
export default function ThreatModelCanvas({ value, onChange }) {
  const { elements = [], connections = [] } = value || {};
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);

  const [tool,       setTool]       = useState('select');
  const [dragging,   setDragging]   = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [anchorDrag, setAnchorDrag] = useState(null); // { fromId, anchorId } when dragging from an anchor
  const [selected,   setSelected]   = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [mode,       setMode]       = useState('canvas');
  const [uploadedImage, setUploadedImage] = useState(value?.uploadedImage || null);
  const [collapsed,  setCollapsed]  = useState({});
  const [,    setSvgRect]    = useState(null);
  const fileRef = useRef(null);

  // Mouse position as ref (no re-renders) + state only for live-line drawing
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [lineEnd, setLineEnd] = useState({ x: 0, y: 0 }); // only updated when drawing a live line

  const emit = useCallback((els, conns, img) => {
    onChange?.({ elements: els, connections: conns, uploadedImage: img ?? uploadedImage });
  }, [onChange, uploadedImage]);

  // Update svgRect on resize
  useEffect(() => {
    const update = () => { if (svgRef.current) setSvgRect(svgRef.current.getBoundingClientRect()); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const svgCoords = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ── Palette drag ────────────────────────────────────────────────────────────
  const onPaletteDragStart = (e, type) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };
  const onCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onCanvasDrop = (e) => {
    const type = e.dataTransfer.getData('elementType');
    if (!type || !ELEMENT_DEFS[type]) return;
    const def = ELEMENT_DEFS[type];
    const { x, y } = svgCoords(e);
    const newEl = { id: uuidv4(), type, x: x - def.w/2, y: y - def.h/2, w: def.w, h: def.h, label: def.label };
    const newEls = [...elements, newEl];
    emit(newEls, connections);
    setSelected(newEl.id);
  };

  // ── Element mouse events ───────────────────────────────────────────────────
  const onElementMouseDown = (e, id) => {
    if (tool !== 'select') return;
    if (anchorDrag) return;
    e.preventDefault();
    setSelected(id);
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const { x, y } = svgCoords(e);
    setDragging({ id, ox: x - el.x, oy: y - el.y });
  };

  // ── Window-level drag handlers (keep drag alive when cursor leaves SVG) ──────
  // elementsRef / connectionsRef hold the latest values without capturing stale closures
  const elementsRef    = useRef(elements);
  const connectionsRef = useRef(connections);
  const draggingRef    = useRef(dragging);
  const anchorDragRef  = useRef(anchorDrag);
  const connectingRef  = useRef(connecting);
  elementsRef.current    = elements;
  connectionsRef.current = connections;
  draggingRef.current    = dragging;
  anchorDragRef.current  = anchorDrag;
  connectingRef.current  = connecting;

  useEffect(() => {
    const isActive = () => draggingRef.current || anchorDragRef.current;

    const onWindowMove = (e) => {
      if (!isActive()) return;
      const pos = svgCoords(e);
      mousePosRef.current = pos;

      if (anchorDragRef.current || connectingRef.current) {
        setLineEnd(pos);
        return;
      }
      const d = draggingRef.current;
      if (!d) return;
      const newEls = elementsRef.current.map(el =>
        el.id === d.id ? { ...el, x: pos.x - d.ox, y: pos.y - d.oy } : el
      );
      emit(newEls, connectionsRef.current);
    };

    const onWindowUp = () => {
      if (!isActive()) return;
      setDragging(null);
      draggingRef.current = null;
      if (anchorDragRef.current) {
        setAnchorDrag(null);
        setConnecting(null);
      }
    };

    window.addEventListener('mousemove', onWindowMove);
    window.addEventListener('mouseup',   onWindowUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMove);
      window.removeEventListener('mouseup',   onWindowUp);
    };
  // emit is stable (useCallback); svgCoords reads svgRef directly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emit]);

  const onSVGMouseMove = (_e) => {
    // When NOT dragging, still update live-line cursor for connect mode
    if (!dragging && !anchorDrag) {
      if (connecting) {
        const pos = svgCoords(_e);
        mousePosRef.current = pos;
        setLineEnd(pos);
      }
    }
    // Drag is handled by window listener above
  };

  // onSVGMouseUp kept as fallback (fires when released inside SVG)
  const onSVGMouseUp = () => {
    setDragging(null);
    if (anchorDrag) {
      setAnchorDrag(null);
      setConnecting(null);
    }
  };
  const onSVGClick = () => { if (tool === 'select') setSelected(null); if (tool === 'connect') setConnecting(null); };

  // ── Connect mode ────────────────────────────────────────────────────────────
  const onConnectClick = (id) => {
    if (!connecting) {
      setConnecting(id);
    } else if (connecting !== id) {
      const exists = connections.some(c =>
        (c.fromId === connecting && c.toId === id) ||
        (c.fromId === id && c.toId === connecting)
      );
      if (!exists) {
        const newConns = [...connections, {
          id: uuidv4(), fromId: connecting, toId: id,
          label: '', protocol: 'HTTPS', direction: 'forward',
        }];
        emit(elements, newConns);
        // auto-select new connection
        setSelected(newConns[newConns.length - 1].id);
      }
      setConnecting(null);
      setTool('select');
    }
  };

  // ── Anchor drag-to-connect ───────────────────────────────────────────────────
  const onAnchorDown = (e, elementId, anchorId) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorDrag({ fromId: elementId, anchorId });
    setConnecting(elementId);
    setDragging(null);
    setSelected(null);
  };

  // Called when mouse is released on any element — DO NOT stopPropagation here
  // so that onSVGMouseUp always fires to clear dragging state
  const onElementMouseUp = (id) => {
    if (anchorDrag && anchorDrag.fromId !== id) {
      // Complete the connection
      const exists = connections.some(c =>
        (c.fromId === anchorDrag.fromId && c.toId === id) ||
        (c.fromId === id && c.toId === anchorDrag.fromId)
      );
      if (!exists) {
        const newConns = [...connections, {
          id: uuidv4(), fromId: anchorDrag.fromId, toId: id,
          label: '', protocol: 'HTTPS', direction: 'forward',
        }];
        emit(elements, newConns);
        setSelected(newConns[newConns.length - 1].id);
      }
      setAnchorDrag(null);
      setConnecting(null);
    }
  };

  // Compute which element is under the cursor during anchor drag (for highlight)
  const anchorDragTarget = anchorDrag ? elements.find(el =>
    el.id !== anchorDrag.fromId &&
    lineEnd.x >= el.x && lineEnd.x <= el.x + el.w &&
    lineEnd.y >= el.y && lineEnd.y <= el.y + el.h
  )?.id ?? null : null;

  // ── Label editing ───────────────────────────────────────────────────────────
  const onDblClick = (e, id) => {
    const el = elements.find(el => el.id === id);
    if (el) setEditing({ id, label: el.label });
  };
  const onEditChange  = (e) => setEditing(prev => ({ ...prev, label: e.target.value }));
  const onEditCommit  = () => {
    if (!editing) return;
    emit(elements.map(el => el.id === editing.id ? { ...el, label: editing.label } : el), connections);
    setEditing(null);
  };

  // ── Delete selected ─────────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    emit(
      elements.filter(el => el.id !== selected),
      connections.filter(c => c.id !== selected && c.fromId !== selected && c.toId !== selected)
    );
    setSelected(null);
  }, [selected, elements, connections, emit]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !editing) deleteSelected();
      if (e.key === 'Escape') { setConnecting(null); setAnchorDrag(null); setEditing(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, editing, deleteSelected]);

  // ── Connection update ───────────────────────────────────────────────────────
  const updateConnection = (updates) => {
    emit(elements, connections.map(c => c.id === selected ? { ...c, ...updates } : c));
  };

  // ── Image upload ────────────────────────────────────────────────────────────
  const onImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const img = ev.target.result; setUploadedImage(img); emit(elements, connections, img); };
    reader.readAsDataURL(file);
  };

  const clearCanvas = () => { emit([], [], null); setUploadedImage(null); setSelected(null); setConnecting(null); };

  // ── Render: zones behind everything, stick figures on top ──────────────────
  const sorted = [...elements].sort((a, b) => {
    const az = ZONE_TYPES.has(a.type) ? 0 : 1;
    const bz = ZONE_TYPES.has(b.type) ? 0 : 1;
    return az - bz;
  });

  // ── Selected connection for panel ──────────────────────────────────────────
  const selectedConn = connections.find(c => c.id === selected);
  let connPanelPos = null;
  if (selectedConn) {
    const from = elements.find(e => e.id === selectedConn.fromId);
    const to   = elements.find(e => e.id === selectedConn.toId);
    if (from && to) connPanelPos = connectionPath(from, to).mid;
  }

  // ── Protocol color for a connection ───────────────────────────────────────
  const connColor = (conn, isSel) => {
    if (isSel) return '#2563eb';
    const p = conn.protocol || 'Custom';
    return PROTOCOLS[p]?.color ?? '#94a3b8';
  };

  return (
    <div className="flex flex-col h-full bg-white" ref={wrapRef}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
          <button title="Select / Move (S)"
            onClick={() => { setTool('select'); setConnecting(null); }}
            className={`p-1.5 rounded-md transition-all ${tool === 'select' ? 'bg-white shadow text-blue-600 ring-1 ring-blue-200' : 'text-gray-500 hover:text-gray-700'}`}
          ><MousePointer2 className="w-4 h-4" /></button>
          <button title="Draw Connection (C)"
            onClick={() => setTool('connect')}
            className={`p-1.5 rounded-md transition-all ${tool === 'connect' ? 'bg-white shadow text-violet-600 ring-1 ring-violet-200' : 'text-gray-500 hover:text-gray-700'}`}
          ><Link2 className="w-4 h-4" /></button>
        </div>
        <div className="h-4 w-px bg-gray-200 mx-1" />
        <button onClick={deleteSelected} disabled={!selected} title="Delete selected (Del)"
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all"
        ><Trash2 className="w-4 h-4" /></button>
        <button onClick={clearCanvas} title="Clear canvas"
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        ><RotateCcw className="w-4 h-4" /></button>
        <div className="h-4 w-px bg-gray-200 mx-1" />
        {selected && !selectedConn && (
          <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg tracking-widest uppercase">
            {ELEMENT_DEFS[elements.find(e=>e.id===selected)?.type]?.label ?? 'Element'} · Del · Dbl-click
          </span>
        )}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1 ml-auto">
          <button onClick={() => setMode('canvas')}
            className={`px-3 py-1 text-[10px] font-mono rounded-md tracking-widest uppercase transition-all ${mode === 'canvas' ? 'bg-white text-blue-600 shadow ring-1 ring-blue-100' : 'text-gray-500 hover:text-gray-700'}`}
          >Diagram</button>
          <button onClick={() => setMode('image')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono rounded-md tracking-widest uppercase transition-all ${mode === 'image' ? 'bg-white text-blue-600 shadow ring-1 ring-blue-100' : 'text-gray-500 hover:text-gray-700'}`}
          ><ImagePlus className="w-3 h-3" />Image</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {mode === 'canvas' ? (
          <>
            {/* Palette */}
            <div className="w-44 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
              <div className="p-2 pt-3">
                {CATEGORIES.map((cat) => {
                  const isCollapsed = collapsed[cat.id];
                  return (
                    <div key={cat.id} className="mb-1.5">
                      <button
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => setCollapsed(c => ({ ...c, [cat.id]: !c[cat.id] }))}
                      >
                        <span className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-widest">{cat.label}</span>
                        {isCollapsed ? <ChevronRight className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                      </button>
                      {!isCollapsed && (
                        <div className="grid grid-cols-2 gap-1 mt-1 px-1 pb-1">
                          {cat.types.map((type) => {
                            const def = ELEMENT_DEFS[type];
                            return (
                              <div key={type} draggable onDragStart={(e) => onPaletteDragStart(e, type)}
                                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border cursor-grab active:cursor-grabbing hover:bg-white hover:shadow-sm transition-all select-none"
                                style={{ borderColor: def.color + '50', background: def.bg + '60' }}
                                title={def.desc}
                              >
                                <PaletteIcon type={type} color={def.color} bg={def.bg} />
                                <span className="text-center leading-tight mt-0.5 line-clamp-2 font-mono"
                                  style={{ color: def.color, fontSize: '9px' }}>{def.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-auto p-3 border-t border-gray-200">
                <p className="text-[9px] font-mono text-gray-400 flex items-start gap-1.5 leading-relaxed tracking-wider">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  drag · anchor · rename
                </p>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-hidden relative bg-white"
              onDragOver={onCanvasDragOver}
              onDrop={onCanvasDrop}>
              {connecting && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-purple-600 text-white text-[10px] font-mono px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 tracking-wide">
                  <Link2 className="w-3 h-3" />
                  {anchorDrag ? 'drop on target · esc to cancel' : 'click target · esc to cancel'}
                  <button onClick={() => { setConnecting(null); setAnchorDrag(null); setTool('select'); }} className="ml-1 hover:text-purple-200"><X className="w-3 h-3" /></button>
                </div>
              )}
              <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ minHeight: 500, background: '#f8fafc', cursor: tool === 'connect' ? 'crosshair' : 'default' }}
                onDragOver={onCanvasDragOver}
                onDrop={onCanvasDrop}
                onMouseMove={onSVGMouseMove}
                onMouseUp={onSVGMouseUp}
                onClick={onSVGClick}
              >
                <defs>
                  {/* CSS-based anchor visibility — no React state re-renders */}
                  <style>{`
                    .shape-anchors { opacity: 0; transition: opacity 0.15s ease; }
                    .shape-group:hover .shape-anchors { opacity: 1; }
                  `}</style>
                  <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.9" fill="#cbd5e1" opacity="0.7" />
                  </pattern>
                  {/* Arrow markers for all protocols */}
                  {MARKER_DEFS.map(({ id: mid, color }) => (
                    <g key={mid}>
                      <marker id={`ae-${mid}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                      </marker>
                      <marker id={`as-${mid}`} markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto">
                        <polygon points="10 0, 0 3.5, 10 7" fill={color} />
                      </marker>
                    </g>
                  ))}
                  <marker id="ae-conn" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                  </marker>
                </defs>

                <rect width="100%" height="100%" fill="url(#canvas-grid)" />

                {elements.length === 0 && !connecting && (
                  <g>
                    <text x="50%" y="46%" textAnchor="middle" fill="#94a3b8" fontSize="12"
                      fontFamily="ui-monospace, SFMono-Regular, 'Courier New', monospace" letterSpacing="0.08em">
                      DROP COMPONENTS TO BEGIN ARCHITECTURE MAPPING
                    </text>
                    <text x="50%" y="51%" textAnchor="middle" fill="#cbd5e1" fontSize="10"
                      fontFamily="ui-monospace, SFMono-Regular, 'Courier New', monospace" letterSpacing="0.04em">
                      connect components · run AI analysis · identify threats
                    </text>
                  </g>
                )}

                {/* Connections */}
                {connections.map((conn) => {
                  const from = elements.find(e => e.id === conn.fromId);
                  const to   = elements.find(e => e.id === conn.toId);
                  if (!from || !to) return null;
                  const { d, mid } = connectionPath(from, to);
                  const isSel  = selected === conn.id;
                  const mid_id = isSel ? 'sel' : markerId(conn.protocol || 'Custom');
                  const c      = connColor(conn, isSel);
                  const dir    = conn.direction || 'forward';
                  const proto  = conn.protocol || 'Custom';
                  return (
                    <g key={conn.id}
                      onClick={(e) => { e.stopPropagation(); setSelected(conn.id); setSvgRect(svgRef.current?.getBoundingClientRect()); }}
                      style={{ cursor: 'pointer' }}>
                      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
                      <path d={d} fill="none" stroke={c} strokeWidth={isSel ? 2.5 : 1.8}
                        strokeDasharray={proto === 'UDP' || proto === 'ICMP' ? '6,4' : undefined}
                        markerEnd={dir !== 'backward' ? `url(#ae-${mid_id})` : undefined}
                        markerStart={dir === 'bidirectional' || dir === 'backward' ? `url(#as-${mid_id})` : undefined}
                      />
                      {/* Protocol badge */}
                      {proto && proto !== 'Custom' && (
                        <>
                          <rect x={mid.x - 16} y={mid.y - 9} width={32} height={13} rx={6}
                            fill={c} opacity={isSel ? 0.95 : 0.8} />
                          <text x={mid.x} y={mid.y + 1} textAnchor="middle" fontSize={8} fill="white"
                            fontWeight="700" style={{ pointerEvents: 'none' }}>{proto}</text>
                        </>
                      )}
                      {/* Connection label */}
                      {conn.label && (
                        <text x={mid.x} y={mid.y - 12} textAnchor="middle" fontSize={10} fill="#374151"
                          fontWeight="500" style={{ pointerEvents: 'none' }}>{conn.label}</text>
                      )}
                    </g>
                  );
                })}

                {/* Live connection line (connect mode or anchor drag) */}
                {connecting && (() => {
                  const from = elements.find(e => e.id === connecting);
                  if (!from) return null;
                  let startPt;
                  if (anchorDrag) {
                    const anchors = getAnchorPoints(from);
                    const anchor = anchors.find(a => a.id === anchorDrag.anchorId);
                    startPt = anchor ? { x: anchor.cx, y: anchor.cy } : getEdgePoint(from, lineEnd.x, lineEnd.y);
                  } else {
                    startPt = getEdgePoint(from, lineEnd.x, lineEnd.y);
                  }
                  return (
                    <line x1={startPt.x} y1={startPt.y} x2={lineEnd.x} y2={lineEnd.y}
                      stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6,4"
                      markerEnd="url(#ae-conn)" style={{ pointerEvents: 'none' }} />
                  );
                })()}

                {/* Elements */}
                {sorted.map((el) => (
                  <Shape key={el.id} el={el}
                    isSelected={selected === el.id}
                    isConnecting={connecting === el.id}
                    isDragTarget={anchorDragTarget === el.id}
                    isDragging={!!dragging || !!anchorDrag}
                    tool={tool}
                    onMouseDown={onElementMouseDown}
                    onDblClick={onDblClick}
                    onConnectClick={onConnectClick}
                    onAnchorDown={onAnchorDown}
                    onMouseUp={onElementMouseUp}
                    onDragOver={onCanvasDragOver}
                    onDrop={onCanvasDrop}
                    editingId={editing?.id}
                    editLabel={editing?.label ?? ''}
                    onEditChange={onEditChange}
                    onEditCommit={onEditCommit}
                  />
                ))}
              </svg>

              {/* Connection edit panel (portals via fixed positioning) */}
              {selectedConn && connPanelPos && (
                <ConnectionPanel
                  conn={selectedConn}
                  position={connPanelPos}
                  svgRect={svgRef.current?.getBoundingClientRect()}
                  onUpdate={updateConnection}
                  onDelete={deleteSelected}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          </>
        ) : (
          /* Image upload mode */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
            {uploadedImage ? (
              <div className="relative max-w-4xl w-full">
                <img src={uploadedImage} alt="Uploaded diagram"
                  className="w-full rounded-xl shadow-lg border border-gray-200 object-contain max-h-[500px]" />
                <button
                  onClick={() => { setUploadedImage(null); emit(elements, connections, null); }}
                  className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-red-500 transition-colors"
                ><X className="w-4 h-4" /></button>
                <p className="text-center text-[10px] font-mono text-gray-400 mt-3 tracking-wider">click × to remove</p>
              </div>
            ) : (
              <div
                className="border border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer max-w-md w-full"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-mono text-sm mb-1 tracking-wide">Upload a system diagram</p>
                <p className="text-xs font-mono text-gray-400 tracking-wider">PNG · JPG · SVG</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}
