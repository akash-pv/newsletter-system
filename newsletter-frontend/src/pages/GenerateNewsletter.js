// src/pages/GenerateNewsletter.js

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Constants for Droppable IDs ---
const SIDEBAR_DROPPABLE_ID = "sidebar-droppable-area";
const LAYOUT_DROPPABLE_ID = "layout-droppable-area";

// --- Item Component (Newspaper Article) ---
const LayoutItem = ({ item, handleRemove, resizeMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
    cursor: "move",
    touchAction: "none",
    position: "relative",
    ...(resizeMode ? { resize: "vertical", overflow: "auto", minHeight: "100px" } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="newspaper-article-item p-3 bg-white border border-gray-300 shadow-sm flex flex-col"
    >
      <div className="flex-grow">
        <h3 className="text-xl font-bold mb-2 text-black leading-tight">
          {item.title}
        </h3>
        {item.image_url && (
          <img
            src={`http://localhost:5000/uploads/${item.image_url}`}
            alt={item.title}
            className="float-left mr-4 mb-2 w-1/3 object-cover rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://placehold.co/200x150/eee/ccc?text=No+Image";
            }}
            loading="lazy"
          />
        )}
        <p className="text-gray-800 text-sm text-justify leading-relaxed">
          {item.content}
        </p>
      </div>

      {handleRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove(item.id);
          }}
          className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-2xl font-bold w-6 h-6 flex items-center justify-center bg-white bg-opacity-50 rounded-full focus:outline-none focus:ring-1 focus:ring-red-400"
          aria-label="Remove item"
        >
          &times;
        </button>
      )}
    </div>
  );
};

// --- Sidebar Item (Draggable) ---
const DraggableSidebarItem = ({ id, item, onView, onAddToLayout }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "sidebarItem", itemData: item },
  });

  const style = { opacity: isDragging ? 0.4 : 1, cursor: "grab", touchAction: "none" };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 bg-white border border-gray-300 rounded-md shadow-sm mb-2 flex items-center hover:bg-blue-50"
    >
      <div className="flex-grow cursor-pointer truncate" onClick={() => onAddToLayout(item)}>
        <h4 className="font-semibold text-sm">{item.title}</h4>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(item);
        }}
        className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        View
      </button>
    </div>
  );
};

// --- Drag Overlay (Preview) ---
const DragOverlayItem = ({ item }) => (
  <div className="p-3 bg-slate-200 border border-gray-400 rounded-md shadow-xl mb-2 opacity-80 z-50 cursor-grabbing">
    <h4 className="font-bold text-md mb-1 truncate">{item.title}</h4>
  </div>
);

// --- Main Component ---
const GenerateNewsletter = () => {
  // Layout & Sidebar
  const [sidebarItems, setSidebarItems] = useState([]);
  const [layoutItems, setLayoutItems] = useState([]);

  // UI state
  const [activeId, setActiveId] = useState(null);
  const [activeItemData, setActiveItemData] = useState(null);
  const [selectedItemForView, setSelectedItemForView] = useState(null);
  const [newsletterTitle, setNewsletterTitle] = useState("NEWSUPDATE JUNE");
  const [newsletterDate, setNewsletterDate] = useState(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  const [numColumns, setNumColumns] = useState(2);
  const [resizeMode, setResizeMode] = useState(false);

  // Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortDate, setSortDate] = useState("");

  // Fetch approved articles
  useEffect(() => {
    const fetchApprovedArticles = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/articles/approved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSidebarItems(res.data.map((item) => ({ ...item, id: String(item.id) })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchApprovedArticles();
  }, []);

  // Filter + Sort for Sidebar
  const filteredSidebarItems = useMemo(() => {
    let items = [...sidebarItems];
    if (fromDate) items = items.filter((i) => new Date(i.submitted_at) >= new Date(fromDate));
    if (toDate) items = items.filter((i) => new Date(i.submitted_at) <= new Date(toDate));
    if (sortDate) {
      items.sort((a, b) => {
        const diff = new Date(a.submitted_at) - new Date(b.submitted_at);
        return sortDate === "asc" ? diff : -diff;
      });
    }
    return items;
  }, [sidebarItems, fromDate, toDate, sortDate]);

  const resetAllFilters = () => {
    setFromDate("");
    setToDate("");
    setSortDate("");
  };

  // DnD-kit sensors & droppables
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const { setNodeRef: setSidebarRef } = useDroppable({ id: SIDEBAR_DROPPABLE_ID });
  const { setNodeRef: setLayoutRef, isOver: isOverLayoutDropArea } =
    useDroppable({ id: LAYOUT_DROPPABLE_ID });

  // DnD handlers
  const handleDragStart = ({ active }) => {
    const id = String(active.id);
    setActiveId(id);
    const item =
      sidebarItems.find((i) => i.id === id) ||
      layoutItems.find((i) => i.id === id);
    setActiveItemData(item);
  };
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setActiveItemData(null);
    if (!over) return;
    const aId = String(active.id),
      oId = String(over.id);
    const fromSidebar = sidebarItems.some((i) => i.id === aId);
    const fromLayout = layoutItems.some((i) => i.id === aId);
    const toLayoutArea = oId === LAYOUT_DROPPABLE_ID;
    const toLayoutItem = layoutItems.some((i) => i.id === oId);
    const toSidebarArea = oId === SIDEBAR_DROPPABLE_ID;

    if (fromSidebar && (toLayoutArea || toLayoutItem)) {
      const dragged = sidebarItems.find((i) => i.id === aId);
      setLayoutItems((prev) => {
        const idx = toLayoutItem ? prev.findIndex((i) => i.id === oId) : prev.length;
        return [...prev.slice(0, idx), dragged, ...prev.slice(idx)];
      });
      setSidebarItems((prev) => prev.filter((i) => i.id !== aId));
    }
    if (fromLayout && (toLayoutArea || toLayoutItem)) {
      const oldIdx = layoutItems.findIndex((i) => i.id === aId);
      const newIdx = toLayoutItem
        ? layoutItems.findIndex((i) => i.id === oId)
        : layoutItems.length - 1;
      setLayoutItems((prev) => arrayMove(prev, oldIdx, newIdx));
    }
    if (fromLayout && toSidebarArea) {
      const dragged = layoutItems.find((i) => i.id === aId);
      setSidebarItems((prev) =>
        [...prev, dragged].sort((a, b) => parseInt(a.id) - parseInt(b.id))
      );
      setLayoutItems((prev) => prev.filter((i) => i.id !== aId));
    }
  };
  const handleDragCancel = () => {
    setActiveId(null);
    setActiveItemData(null);
  };

  // Remove / add handlers
  const handleRemove = (id) => {
    const item = layoutItems.find((i) => i.id === id);
    setSidebarItems((prev) =>
      [...prev, item].sort((a, b) => parseInt(a.id) - parseInt(b.id))
    );
    setLayoutItems((prev) => prev.filter((i) => i.id !== id));
  };
  const handleAddToLayout = (item) => {
    if (!layoutItems.some((i) => i.id === item.id)) {
      setLayoutItems((prev) => [...prev, item]);
      setSidebarItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  // PDF generation
  const handleGeneratePDF = async () => {
    if (!layoutItems.length) return alert("Add items before generating.");
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: newsletterTitle,
        date: newsletterDate,
        articles: layoutItems,
        numColumns,
      };
      const res = await axios.post(
        "http://localhost:5000/newsletter/generate",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Generated!");
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen flex flex-col items-center bg-slate-200 p-4 md:p-6 font-serif">

        {/* --- Filter Bar --- */}
        <div className="w-full max-w-screen-xl px-4 md:px-0 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">

              {/* From */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From:
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  To:
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded px-2 py-1"
                />
              </div>

              {/* Sort by Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sort by Date:
                </label>
                <select
                  value={sortDate}
                  onChange={(e) => setSortDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">None</option>
                  <option value="asc">Oldest first</option>
                  <option value="desc">Newest first</option>
                </select>
              </div>

              {/* Clear All */}
              <div>
                <button
                  onClick={resetAllFilters}
                  className="w-full px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                >
                  Clear All
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* --- Main Layout + Sidebar --- */}
        <div className="w-full max-w-screen-xl flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside
            ref={setSidebarRef}
            id={SIDEBAR_DROPPABLE_ID}
            className="w-full md:w-1/4 bg-gray-100 p-4 shadow-lg rounded-lg max-h-[calc(100vh-180px)] overflow-auto border border-gray-300"
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-3 pb-2 sticky top-0 bg-gray-100 border-b-2 border-gray-400 z-10">
              Available Articles
            </h3>
            <div className="flex-grow">
              {filteredSidebarItems.length === 0 ? (
                <p className="text-gray-500 text-center mt-4">No items.</p>
              ) : (
                filteredSidebarItems.map((item) => (
                  <DraggableSidebarItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    onView={setSelectedItemForView}
                    onAddToLayout={handleAddToLayout}
                  />
                ))
              )}
            </div>
          </aside>

          {/* Layout Area */}
          <div className="w-full md:w-3/4 flex flex-col">
            {/* Controls */}
            <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center">
                <label htmlFor="numColumns" className="mr-2 text-sm font-medium text-gray-700">
                  Columns:
                </label>
                <select
                  id="numColumns"
                  value={numColumns}
                  onChange={(e) => setNumColumns(parseInt(e.target.value, 10))}
                  className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={resizeMode}
                  onChange={(e) => setResizeMode(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2">Resize Mode</span>
              </label>
            </div>

            <div
              ref={setLayoutRef}
              id={LAYOUT_DROPPABLE_ID}
              className={`flex-grow bg-white p-6 shadow-2xl rounded-sm max-h-[calc(100vh-220px)] overflow-auto border-2 ${
                isOverLayoutDropArea ? "border-blue-500 bg-blue-50" : "border-gray-400"
              }`}
            >
              <div className="mb-8 pb-4 border-b-4 border-gray-700 text-center">
                <input
                  type="text"
                  value={newsletterTitle}
                  onChange={(e) => setNewsletterTitle(e.target.value)}
                  className="text-5xl font-extrabold w-full mb-1 border-0 focus:ring-0 focus:border-b-2 focus:border-black bg-transparent text-center"
                />
                <input
                  type="text"
                  value={newsletterDate}
                  onChange={(e) => setNewsletterDate(e.target.value)}
                  className="text-sm w-full p-1 border-0 focus:ring-0 bg-transparent text-center text-gray-600"
                />
              </div>

              <SortableContext items={layoutItems.map((i) => i.id)} strategy={rectSortingStrategy}>
                {layoutItems.length === 0 ? (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-400 rounded-md bg-gray-50">
                    <p className="text-gray-600">Drag or click articles here</p>
                  </div>
                ) : (
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${numColumns}, minmax(0,1fr))`,
                      gridAutoFlow: "row dense",
                      gridAutoRows: "min-content",
                    }}
                  >
                    {layoutItems.map((item) => (
                      <LayoutItem
                        key={item.id}
                        item={item}
                        handleRemove={handleRemove}
                        resizeMode={resizeMode}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </div>

            <button
              onClick={handleGeneratePDF}
              disabled={!layoutItems.length}
              className={`mt-4 w-full py-3 text-lg font-semibold text-white rounded-md transition ${
                layoutItems.length
                  ? "bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:ring-slate-400"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Generate PDF Newsletter
            </button>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeId && activeItemData && <DragOverlayItem item={activeItemData} />}
        </DragOverlay>

        {/* Modal View */}
        {selectedItemForView && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto relative">
              <button
                onClick={() => setSelectedItemForView(null)}
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl"
              >
                &times;
              </button>
              <h3 className="text-3xl font-bold mb-3 border-b pb-2">
                {selectedItemForView.title}
              </h3>
              {selectedItemForView.image_url && (
                <img
                  src={`http://localhost:5000/uploads/${selectedItemForView.image_url}`}
                  alt={selectedItemForView.title}
                  className="mx-auto mb-4 max-h-80 object-contain"
                  loading="lazy"
                />
              )}
              <div className="text-gray-800 text-justify whitespace-pre-line leading-relaxed">
                {selectedItemForView.content}
            </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default GenerateNewsletter;
