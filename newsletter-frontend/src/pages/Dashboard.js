// src/pages/Dashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardDocumentCheckIcon,
  DocumentPlusIcon,
  NewspaperIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import zingLogo from "../assets/Zinghrlogo.png";


// --- Helpers to draw SVG sectors and to convert polar→Cartesian ---
const polarToCartesian = (cx, cy, r, angleDeg) => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const describeSector = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${cx} ${cy}`, 
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`, 
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`, 
    "Z",
  ].join(" ");
};

const RadialButton = ({ Icon, label, gradient, onClick }) => (
  <button
    onClick={onClick}
    className={`
      ${gradient}
      w-28 h-28
      rounded-full
      flex flex-col items-center justify-center
      shadow-lg
      transform transition-transform duration-200
      hover:scale-110
      focus:outline-none
    `}
  >
    <Icon className="h-14 w-14 text-white mb-1" />
    <span className="text-base font-medium text-white">{label}</span>
  </button>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const role     = localStorage.getItem("role") || "User";
  // const userName = localStorage.getItem("name") || "User";

  // --- Build menu items with their gradients & hex stops ---
  const items = [];
  if (role === "Admin") {
    items.push(
      {
        icon: ClipboardDocumentCheckIcon,
        label: "Requests",
        path: "/approval-requests",
        gradient: "bg-gradient-to-br from-blue-600 to-cyan-400",
        colors: ["#2563EB", "#22D3EE"],
      },
      {
        icon: DocumentPlusIcon,
        label: "Upload",
        path: "/upload",
        gradient: "bg-gradient-to-br from-purple-600 to-pink-500",
        colors: ["#7C3AED", "#EC4899"],
      },
      {
        icon: ClipboardDocumentCheckIcon,
        label: "Approve",
        path: "/approve",
        gradient: "bg-gradient-to-br from-green-600 to-emerald-400",
        colors: ["#16A34A", "#34D399"],
      },
      {
        icon: NewspaperIcon,
        label: "Generate",
        path: "/generate-newsletter",
        gradient: "bg-gradient-to-br from-indigo-600 to-blue-500",
        colors: ["#4F46E5", "#3B82F6"],
      },
      {
        icon: DocumentTextIcon,
        label: "Previous",
        path: "/previous-releases",
        gradient: "bg-gradient-to-br from-teal-600 to-green-400",
        colors: ["#0D9488", "#4ADE80"],
      },
      {
        icon: QuestionMarkCircleIcon,
        label: "FAQs",
        path: "/faq",
        gradient: "bg-gradient-to-br from-yellow-500 to-orange-400",
        colors: ["#EAB308", "#FB923C"],
      }
    );
  } else if (role === "Approver") {
    items.push(
      {
        icon: ClipboardDocumentCheckIcon,
        label: "Approve",
        path: "/approve",
        gradient: "bg-gradient-to-br from-green-600 to-emerald-400",
        colors: ["#16A34A", "#34D399"],
      },
      {
        icon: DocumentTextIcon,
        label: "Previous",
        path: "/previous-releases",
        gradient: "bg-gradient-to-br from-teal-600 to-green-400",
        colors: ["#0D9488", "#4ADE80"],
      }
    );
  } else {
    items.push(
      {
        icon: DocumentPlusIcon,
        label: "Upload",
        path: "/upload",
        gradient: "bg-gradient-to-br from-purple-600 to-pink-500",
        colors: ["#7C3AED", "#EC4899"],
      },
      {
        icon: ClipboardDocumentCheckIcon,
        label: "Status",
        path: "/status",
        gradient: "bg-gradient-to-br from-blue-600 to-cyan-400",
        colors: ["#2563EB", "#22D3EE"],
      },
      {
        icon: QuestionMarkCircleIcon,
        label: "FAQs",
        path: "/faq",
        gradient: "bg-gradient-to-br from-yellow-500 to-orange-400",
        colors: ["#EAB308", "#FB923C"],
      }
    );
  }

  // always add logout
  items.push({
    icon: ArrowLeftOnRectangleIcon,
    label: "Logout",
    onClick: () => { localStorage.clear(); navigate("/"); },
    gradient: "bg-gradient-to-br from-red-500 to-rose-500",
    colors: ["#EF4444", "#F43F5E"],
  });

  // --- Geometry ---
  const sliceCount  = items.length;
  const sliceAngle  = 360 / sliceCount;
  const halfAngle   = sliceAngle / 2;
  const radius      = 220;          // px from center to edge
  const centerSize  = 140;          // hub diameter
  const container   = 2 * radius + centerSize;
  const centerCoord = container / 2;

  // Partition lines & button angles at the *boundaries* of each slice:
  const boundaryAngles = items.map((_, i) => sliceAngle * i + halfAngle);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Header + Greeting */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-blue-600">Dashboard</h1>
        
      </div>

      <div
        className="relative"
        style={{ width: container, height: container }}
      >
        <svg
          width={container}
          height={container}
          className="absolute top-0 left-0"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            {items.map((it, i) => (
              <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={it.colors[0]} />
                <stop offset="100%" stopColor={it.colors[1]} />
              </linearGradient>
            ))}
          </defs>

          {/* gradient‐filled slices */}
          {items.map((_, i) => {
            const startA = sliceAngle * i;
            const endA   = sliceAngle * (i + 1);
            const d      = describeSector(centerCoord, centerCoord, radius, startA, endA);
            return <path key={i} d={d} fill={`url(#grad-${i})`} />;
          })}

          {/* outer ring */}
          <circle
            cx={centerCoord}
            cy={centerCoord}
            r={radius}
            stroke="#D1D5DB"
            strokeWidth="4"
            fill="none"
          />

          {/* partition lines at boundaries */}
          {boundaryAngles.map((angle, i) => {
            const { x: x2, y: y2 } = polarToCartesian(centerCoord, centerCoord, radius, angle);
            return (
              <line
                key={i}
                x1={centerCoord}
                y1={centerCoord}
                x2={x2}
                y2={y2}
                stroke="#D1D5DB"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* central hub with logo */}
<div
  className="absolute rounded-full bg-white shadow-2xl flex items-center justify-center p-3"
  style={{
    width: centerSize,
    height: centerSize,
    top: centerCoord,
    left: centerCoord,
    transform: "translate(-50%, -50%)",
  }}
>
  <img
    src={zingLogo}
    alt="ZingHR Logo"
    className="object-contain w-full h-full rounded-full"
  />
</div>


        {/* buttons on the same boundary lines */}
        {boundaryAngles.map((angle, i) => {
          // compute x/y relative to center
          const rel = polarToCartesian(0, 0, radius, angle);
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: centerCoord + rel.y,
                left: centerCoord + rel.x,
                transform: "translate(-50%, -50%)",
              }}
            >
              <RadialButton
                Icon={items[i].icon}
                label={items[i].label}
                gradient={items[i].gradient}
                onClick={() =>
                  items[i].onClick ? items[i].onClick() : navigate(items[i].path)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
