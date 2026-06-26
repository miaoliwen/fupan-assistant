"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  PageTransition,
  FadeIn,
  StaggerReveal,
  StaggerItem,
  motion,
} from "@/components/motion/MotionElements";

interface Node {
  id: string;
  label: string;
  type: "keyword" | "review";
  count?: number;
  category?: string;
  date?: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  stats: {
    totalReviews: number;
    totalKeywords: number;
    topKeywords: { word: string; count: number }[];
  };
}

function ForceGraph({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const hoveredNodeRef = useRef<Node | null>(null);
  const positionsRef = useRef<Record<string, { x: number; y: number; vx: number; vy: number }>>({});
  const animRef = useRef<number>(0);

  const initPositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = 150 + Math.random() * 100;
      positions[n.id] = {
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });
    positionsRef.current = positions;
  }, [nodes]);

  // 同步 ref
  const setHovered = (node: Node | null) => {
    hoveredNodeRef.current = node;
    setHoveredNode(node);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initPositions();
    const positions = positionsRef.current;

    const simulate = () => {
      // Force simulation
      const repulsion = 2000;
      const attraction = 0.005;
      const damping = 0.85;
      const centerX = 400;
      const centerY = 300;

      // Repulsion between all nodes
      nodes.forEach((a) => {
        nodes.forEach((b) => {
          if (a.id === b.id) return;
          const pa = positions[a.id];
          const pb = positions[b.id];
          if (!pa || !pb) return;
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          pa.vx += (dx / dist) * force;
          pa.vy += (dy / dist) * force;
        });
      });

      // Attraction along edges
      edges.forEach((e) => {
        const ps = positions[e.source];
        const pt = positions[e.target];
        if (!ps || !pt) return;
        const dx = pt.x - ps.x;
        const dy = pt.y - ps.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * attraction;
        ps.vx += (dx / dist) * force;
        ps.vy += (dy / dist) * force;
        pt.vx -= (dx / dist) * force;
        pt.vy -= (dy / dist) * force;
      });

      // Center gravity
      nodes.forEach((n) => {
        const p = positions[n.id];
        if (!p) return;
        p.vx += (centerX - p.x) * 0.001;
        p.vy += (centerY - p.y) * 0.001;
        p.vx *= damping;
        p.vy *= damping;
        p.x += p.vx;
        p.y += p.vy;
        // Bounds
        p.x = Math.max(40, Math.min(760, p.x));
        p.y = Math.max(40, Math.min(560, p.y));
      });

      // Draw
      ctx.clearRect(0, 0, 800, 600);

      // Edges
      ctx.strokeStyle = "rgba(135, 134, 127, 0.2)";
      edges.forEach((e) => {
        const ps = positions[e.source];
        const pt = positions[e.target];
        if (!ps || !pt) return;
        ctx.lineWidth = Math.min(e.weight, 3);
        ctx.beginPath();
        ctx.moveTo(ps.x, ps.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      });

      // Nodes
      nodes.forEach((n) => {
        const p = positions[n.id];
        if (!p) return;
        const isKeyword = n.type === "keyword";
        const size = isKeyword ? 4 + (n.count || 1) * 1.5 : 6;
        const isHovered = hoveredNodeRef.current?.id === n.id;

        ctx.beginPath();
        ctx.arc(p.x, p.y, isHovered ? size + 3 : size, 0, Math.PI * 2);

        if (isKeyword) {
          ctx.fillStyle = isHovered ? "var(--terracotta)" : "#c96442";
        } else {
          const colors: Record<string, string> = {
            work: "#c96442",
            project: "#8b7355",
            personal: "#6b8e6b",
            custom: "#87867f",
          };
          ctx.fillStyle = colors[n.category || "custom"] || "#87867f";
        }
        ctx.fill();

        // Label
        const fontSize = isKeyword ? 11 : 10;
        ctx.font = `${fontSize}px -apple-system, "PingFang SC", sans-serif`;
        ctx.fillStyle = "#5e5d59";
        ctx.textAlign = "center";
        const label = n.label.length > 10 ? n.label.slice(0, 10) + "..." : n.label;
        ctx.fillText(label, p.x, p.y - size - 4);
      });

      animRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (800 / rect.width);
      const y = (e.clientY - rect.top) * (600 / rect.height);
      let found: Node | null = null;
      nodes.forEach((n) => {
        const p = positions[n.id];
        if (!p) return;
        const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
        const size = n.type === "keyword" ? 4 + (n.count || 1) * 1.5 : 6;
        if (dist < size + 5) found = n;
      });
      setHovered(found);
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [nodes, edges, initPositions]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full rounded-xl"
        style={{ backgroundColor: "var(--ivory)", border: "1px solid var(--border-cream)" }}
      />
      {hoveredNode && (
        <motion.div
          className="absolute top-4 left-4 px-4 py-3 rounded-lg font-ui"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 16 }}
          style={{
            backgroundColor: "var(--near-black)",
            color: "var(--ivory)",
            fontSize: "13px",
            maxWidth: "240px",
          }}
        >
          <p className="font-medium mb-1">{hoveredNode.label}</p>
          <p style={{ fontSize: "11px", color: "var(--warm-silver)" }}>
            {hoveredNode.type === "keyword"
              ? `关键词 · 出现 ${hoveredNode.count} 次`
              : `复盘 · ${hoveredNode.date}`}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default function GraphPage() {
  const [data, setData] = useState<GraphData | null>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => console.error("加载图谱数据失败:", err));
  }, []);

  if (!data) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-ui"
        style={{ color: "var(--stone-gray)" }}
      >
        加载中...
      </motion.p>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <FadeIn delay={0}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h1
                className="font-serif"
                style={{ fontSize: "28px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.2 }}
              >
                复盘知识图谱
              </h1>
              <p className="font-ui text-sm mt-1" style={{ color: "var(--stone-gray)" }}>
                关键词与复盘的关联网络，发现你思维中的核心主题
              </p>
            </div>
            <Link href="/insights">
              <Button variant="secondary">查看洞察报告</Button>
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mb-6 font-ui text-sm flex gap-4 flex-wrap" style={{ color: "var(--olive-gray)" }}>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--terracotta)", marginRight: 4 }} />
              关键词节点
            </span>
            <span>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--stone-gray)", marginRight: 4 }} />
              复盘节点
            </span>
            <span className="ml-auto" style={{ color: "var(--stone-gray)" }}>
              {data.nodes.length} 节点 · {data.edges.length} 连接
            </span>
          </div>
        </FadeIn>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.15 }}
        >
          <ForceGraph nodes={data.nodes} edges={data.edges} />
        </motion.div>

        {/* Top Keywords Legend */}
        <FadeIn delay={0.25}>
          <div className="mt-6 p-5 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
            <h3 className="font-serif mb-3" style={{ fontSize: "16px", fontWeight: 500, color: "var(--near-black)" }}>
              核心关键词
            </h3>
            <StaggerReveal>
              <div className="flex flex-wrap gap-2">
                {data.stats.topKeywords.map((kw) => (
                  <StaggerItem key={kw.word}>
                    <span
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: kw.count >= 5 ? "var(--terracotta)" : "var(--warm-sand)",
                        color: kw.count >= 5 ? "var(--ivory)" : "var(--charcoal-warm)",
                      }}
                    >
                      {kw.word} ({kw.count})
                    </span>
                  </StaggerItem>
                ))}
              </div>
            </StaggerReveal>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
