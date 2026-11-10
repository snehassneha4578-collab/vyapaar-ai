"use client";

import { useEffect, useState, type FormEvent } from "react";

const navigation = [
  { name: "Overview", icon: "◫" },
  { name: "AI Assistant", icon: "✧" },
  { name: "Inventory", icon: "▦" },
  { name: "Invoices", icon: "▤" },
  { name: "Insights", icon: "⌁" },
];

type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: string;
};

type InvoiceStatus = "Paid" | "Pending" | "Overdue";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
};
function renderAssistantContent(content: string) {
  const cleaned = content
    .replace(/\\([#*_])/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "$1");

  return cleaned.split(/\r?\n/).map((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      return <div className="report-spacer" key={index} />;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      return (
        <h4 className="report-section-heading" key={index}>
          {line}
        </h4>
      );
    }

    if (/^[•*-]\s+/.test(line)) {
      return (
        <p className="report-list-item" key={index}>
          <span className="report-bullet">•</span>
          <span>{line.replace(/^[•*-]\s+/, "")}</span>
        </p>
      );
    }

    if (index === 0 && line.length < 90) {
      return <h3 className="report-title" key={index}>{line}</h3>;
    }

    return <p className="report-paragraph" key={index}>{line}</p>;
  });
}
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
const initialProducts: Product[] = [
  { id: "p1", name: "Basmati Rice", category: "Grains", stock: 124, price: "₹1,250" },
  { id: "p2", name: "Sunflower Oil", category: "Essentials", stock: 18, price: "₹145" },
  { id: "p3", name: "Toor Dal", category: "Pulses", stock: 86, price: "₹180" },
  { id: "p4", name: "Sugar", category: "Essentials", stock: 9, price: "₹48" },
];

function getProductStatus(stock: number) {
  if (stock <= 10) return { label: "Critical", color: "red" };
  if (stock <= 20) return { label: "Low stock", color: "orange" };
  return { label: "Healthy", color: "purple" };
}

const bars = [35, 48, 42, 65, 52, 76, 58, 84, 68, 91, 73, 100];

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon">{children}</span>;
}

function Metric({
  label, value, change, icon, tone,
}: {
  label: string; value: string; change: string; icon: string; tone: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="muted">{label}</span>
        <span className={"metric-icon " + tone}>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        <span className="positive">{change}</span>
        <span className="muted"> vs last month</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [language, setLanguage] = useState("English");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [inventory, setInventory] = useState<Product[]>(initialProducts);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    category: "Essentials",
    stock: "0",
    price: "",
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("All");
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceDraft, setInvoiceDraft] = useState({
    invoiceNumber: "",
    customer: "",
    amount: "",
    issueDate: "",
    dueDate: "",
    status: "Pending" as InvoiceStatus,
  });

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("vyapaar-ai-inventory-v1");
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setInventory(parsed as Product[]);
          }
        }
      } catch {
        console.warn("Saved inventory could not be loaded. Using sample inventory.");
      } finally {
        setInventoryLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!inventoryLoaded) return;
    try {
      window.localStorage.setItem(
        "vyapaar-ai-inventory-v1",
        JSON.stringify(inventory)
      );
    } catch {
      console.error("Inventory could not be saved in browser storage.");
    }
  }, [inventory, inventoryLoaded]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("vyapaar-ai-invoices-v1");
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setInvoices(parsed as Invoice[]);
          }
        }
      } catch {
        console.warn("Saved invoices could not be loaded. Starting with an empty invoice list.");
      } finally {
        setInvoicesLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!invoicesLoaded) return;
    try {
      window.localStorage.setItem(
        "vyapaar-ai-invoices-v1",
        JSON.stringify(invoices)
      );
    } catch {
      console.error("Invoices could not be saved in browser storage.");
    }
  }, [invoices, invoicesLoaded]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = (
      invoice.invoiceNumber + " " + invoice.customer
    ).toLowerCase().includes(invoiceSearch.toLowerCase());

    const matchesStatus =
      invoiceFilter === "All" || invoice.status === invoiceFilter;

    return matchesSearch && matchesStatus;
  });

  const paidAmount = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((total, invoice) => total + invoice.amount, 0);

  const outstandingAmount = invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((total, invoice) => total + invoice.amount, 0);

  const filteredProducts = inventory.filter((product) =>
    (product.name + " " + product.category)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openAddProduct() {
    setEditingId(null);
    setDraft({ name: "", category: "Essentials", stock: "0", price: "" });
    setFormOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      category: product.category,
      stock: String(product.stock),
      price: product.price.replace(/[₹,]/g, ""),
    });
    setFormOpen(true);
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = draft.name.trim();
    const priceValue = Number(draft.price);
    const stockValue = Number(draft.stock);

    if (!name || !Number.isFinite(priceValue) || priceValue <= 0 ||
        !Number.isInteger(stockValue) || stockValue < 0) {
      return;
    }

    const product: Product = {
      id: editingId ?? `product-${Date.now()}`,
      name,
      category: draft.category,
      stock: stockValue,
      price: `₹${priceValue.toLocaleString("en-IN")}`,
    };

    if (editingId) {
      setInventory((previous) =>
        previous.map((item) => item.id === editingId ? product : item)
      );
    } else {
      setInventory((previous) => [...previous, product]);
    }

    setFormOpen(false);
    setEditingId(null);
    setDraft({ name: "", category: "Essentials", stock: "0", price: "" });
  }

  function deleteProduct(id: string) {
    const product = inventory.find((item) => item.id === id);
    if (!product) return;

    if (window.confirm(`Delete ${product.name} from your inventory?`)) {
      setInventory((previous) => previous.filter((item) => item.id !== id));
    }
  }

  function openAddInvoice() {
    const today = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    setEditingInvoiceId(null);
    setInvoiceDraft({
      invoiceNumber: "",
      customer: "",
      amount: "",
      issueDate: today,
      dueDate: today,
      status: "Pending",
    });
    setInvoiceFormOpen(true);
  }

  function openEditInvoice(invoice: Invoice) {
    setEditingInvoiceId(invoice.id);
    setInvoiceDraft({
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      amount: String(invoice.amount),
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
    });
    setInvoiceFormOpen(true);
  }

  function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const invoiceNumber = invoiceDraft.invoiceNumber.trim();
    const customer = invoiceDraft.customer.trim();
    const amount = Number(invoiceDraft.amount);

    if (
      !invoiceNumber ||
      !customer ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !invoiceDraft.issueDate ||
      !invoiceDraft.dueDate ||
      invoiceDraft.dueDate < invoiceDraft.issueDate
    ) {
      window.alert("Please enter valid invoice details and dates.");
      return;
    }

    const duplicate = invoices.some(
      (item) =>
        item.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase() &&
        item.id !== editingInvoiceId
    );

    if (duplicate) {
      window.alert("This invoice number already exists.");
      return;
    }

    const invoice: Invoice = {
      id: editingInvoiceId ?? `invoice-${Date.now()}`,
      invoiceNumber,
      customer,
      amount,
      issueDate: invoiceDraft.issueDate,
      dueDate: invoiceDraft.dueDate,
      status: invoiceDraft.status,
    };

    if (editingInvoiceId) {
      setInvoices((previous) =>
        previous.map((item) =>
          item.id === editingInvoiceId ? invoice : item
        )
      );
    } else {
      setInvoices((previous) => [...previous, invoice]);
    }

    setInvoiceFormOpen(false);
    setEditingInvoiceId(null);
  }

  function deleteInvoice(id: string) {
    const invoice = invoices.find((item) => item.id === id);
    if (!invoice) return;

    if (window.confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      setInvoices((previous) =>
        previous.filter((item) => item.id !== id)
      );
    }
  }

  async function sendMessage() {
    const question = message.trim();

    if (!question || isLoading) return;

    setMessage("");
    setChatError("");
    setMessages((previous) => [
      ...previous,
      { role: "user", content: question },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          language:
            language === "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1"
              ? "Kannada"
              : language === "\u0939\u093F\u0928\u094D\u0926\u0940"
                ? "Hindi"
                : "English",
          businessContext: {
            inventory: inventory.map((product) => ({
              id: product.id,
              name: product.name,
              category: product.category,
              stock: product.stock,
              price: product.price,
            })),
            invoices: invoices.map((invoice) => ({
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customer: invoice.customer,
              amount: invoice.amount,
              issueDate: invoice.issueDate,
              dueDate: invoice.dueDate,
              status: invoice.status,
            })),
          },
        }),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          typeof errorData.error === "string"
            ? errorData.error
            : "Gemini request failed. Please try again."
        );
      }

      const data: { reply?: string } = await response.json();

      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("The AI response was empty.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.reply! },
      ]);
    } catch (error: unknown) {
      setChatError(
        error instanceof Error
          ? error.message
          : "Unable to get an AI response. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand-name">vyapaar<span>.ai</span></div>
            <div className="brand-caption">BUSINESS INTELLIGENCE</div>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">S</div>
          <div className="workspace-info">
            <strong>My Business</strong>
            <span>Free workspace</span>
          </div>
          <span className="workspace-dots">···</span>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => setActive(item.name)}
              className={"nav-item " + (active === item.name ? "active" : "")}
            >
              <Icon>{item.icon}</Icon>
              <span>{item.name}</span>
              {item.name === "AI Assistant" && <span className="nav-new">AI</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">✦</div>
            <strong>Grow smarter with AI</strong>
            <p>Your business deserves better insights.</p>
            <button onClick={() => setActive("AI Assistant")}>Explore AI <span>→</span></button>
          </div>
          <div className="profile">
            <div className="profile-avatar">S</div>
            <div className="profile-info">
              <strong>Business Owner</strong>
              <span>Administrator</span>
            </div>
            <span className="workspace-dots">···</span>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language">
              <option>English</option>
              <option>{"\u0C95\u0CA8\u0CCD\u0CA8\u0CA1"}</option>
              <option>{"\u0939\u093F\u0928\u094D\u0926\u0940"}</option>
            </select>
            <button className="notification" aria-label="Notifications">♧<i /></button>
            <div className="top-avatar">S</div>
          </div>
        </header>

        <div className="page-content">
          {active === "Overview" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="live-dot" /> YOUR BUSINESS AT A GLANCE</div>
                  <h1>Good morning, <span>there.</span></h1>
                  <p className="subtitle">Here&apos;s what&apos;s happening with your business today.</p>
                </div>
                <button className="date-button">▦ &nbsp; Last 30 days &nbsp;⌄</button>
              </div>

              <div className="ai-banner">
                <div className="ai-orb">✦</div>
                <div className="ai-banner-copy">
                  <div className="ai-label">YOUR AI BUSINESS COMPANION</div>
                  <strong>A smarter way to run your business.</strong>
                  <p>Ask questions, understand trends and make confident decisions.</p>
                </div>
                <button onClick={() => setActive("AI Assistant")}>Talk to your AI <span>→</span></button>
                <div className="banner-glow" />
              </div>

              <div className="section-heading">
                <div><h2>Business overview</h2><p>Your key numbers, all in one place.</p></div>
                <span className="sample-tag">DEMO DATA</span>
              </div>

              <div className="metrics-grid">
                <Metric label="Total revenue" value="₹48,250" change="↑ 12.8%" icon="₹" tone="violet" />
                <Metric label="Total orders" value="126" change="↑ 8.2%" icon="↗" tone="cyan" />
                <Metric label="Products" value={String(inventory.length)} change="Live inventory" icon="▦" tone="blue" />
                <Metric label="Low stock items" value={String(inventory.filter((p) => p.stock <= 20).length).padStart(2, "0")} change="Needs attention" icon="!" tone="orange" />
              </div>

              <div className="dashboard-grid">
                <div className="panel revenue-panel">
                  <div className="panel-heading">
                    <div><h3>Revenue overview</h3><p>Your business performance</p></div>
                    <span className="chart-period">Monthly ⌄</span>
                  </div>
                  <div className="revenue-number">₹48,250 <span>↗ 12.8%</span></div>
                  <div className="chart">
                    <div className="chart-y">
                      <span>₹50k</span><span>₹35k</span><span>₹20k</span><span>₹5k</span>
                    </div>
                    <div className="chart-content">
                      <div className="chart-gridlines"><i /><i /><i /><i /></div>
                      <div className="chart-bars">
                        {bars.map((height, index) => (
                          <div key={index} className="bar-column">
                            <div className={"bar " + (index === 11 ? "bar-current" : "")} style={{ height: height + "%" }} />
                            {index % 2 === 0 && <span>{["Jan","Feb","Mar","Apr","May","Jun"][index / 2]}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="chart-note"><span className="legend-dot" /> Revenue <span className="muted">· Illustrative monthly trend</span></div>
                </div>

                <div className="panel insight-panel">
                  <div className="panel-heading"><div><h3>Business health</h3><p>A quick look at your store</p></div><span className="health-icon">✧</span></div>
                  <div className="health-score">
                    <div className="score-ring"><strong>82</strong><span>/100</span></div>
                    <div><strong className="health-good">Looking good</strong><p className="muted">Illustrative score</p></div>
                  </div>
                  <div className="health-line"><span>Inventory health</span><strong>78%</strong></div>
                  <div className="progress-track"><i style={{ width: "78%" }} /></div>
                  <div className="health-line"><span>Order fulfilment</span><strong>92%</strong></div>
                  <div className="progress-track cyan-track"><i style={{ width: "92%" }} /></div>
                  <div className="insight-tip"><span>✦</span><p><strong>Opportunity</strong><br />Review low-stock products to avoid missed sales.</p></div>
                </div>
              </div>

              <div className="panel inventory-panel">
                <div className="panel-heading inventory-heading">
                  <div><h3>Inventory snapshot</h3><p>A quick view of your product stock</p></div>
                  <button className="text-button" onClick={() => setActive("Inventory")}>View inventory →</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>STOCK</th><th>PRICE</th><th>STATUS</th></tr></thead>
                    <tbody>
                      {inventory.slice(0, 3).map((product) => (
                        <tr key={product.name}>
                          <td><strong>{product.name}</strong></td><td>{product.category}</td><td>{product.stock} units</td><td>{product.price}</td>
                          <td><span className={"status " + getProductStatus(product.stock).color}>{getProductStatus(product.stock).label}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="footer-note">VYAPAAR AI <span>·</span> Your business, in a smarter light. <span className="demo-disclaimer">Demo interface · Sample figures, not live business data</span></div>
            </>
          )}

          {active === "AI Assistant" && (
            <div className="subpage">
              <div className="eyebrow"><span className="live-dot" /> MULTILINGUAL BUSINESS INTELLIGENCE</div>
              <h1>Your AI <span>companion.</span></h1>
              <p className="subtitle">Ask about your business in English, Kannada or Hindi.</p>
              <div className="assistant-panel">
                <div className="assistant-orb">✦</div>
                <h2>What would you like to know?</h2>
                <p>Ask Gemini about your inventory and recorded invoices.</p>

                <div className="suggestions">
                  {[
                    "Which products have low stock?",
                    "Summarize my invoices.",
                    "Which products need attention?",
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() => setMessage(question)}
                      disabled={isLoading}
                    >
                      {question} ↗
                    </button>
                  ))}
                </div>

                <div className="chat-messages" aria-live="polite">
                  {messages.map((item, index) => (
                    <div
                      className={
                        item.role === "user"
                          ? "user-message"
                          : "assistant-message"
                      }
                      key={index}
                    >
                      <span className="chat-role">
                        {item.role === "user" ? "You" : "Gemini"}
                      </span>
                      {item.role === "assistant" ? renderAssistantContent(item.content) : <p>{item.content}</p>}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="assistant-message loading-message">
                      <span className="chat-role">Gemini</span>
                      <p>Thinking...</p>
                    </div>
                  )}
                </div>

                {chatError && (
                  <p className="chat-error" role="alert">{chatError}</p>
                )}

                <div className="chat-input">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Ask your business anything..."
                    disabled={isLoading}
                    aria-label="Ask Gemini a business question"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={isLoading || !message.trim()}
                    aria-label="Send message"
                  >
                    ↑
                  </button>
                </div>

                <span className="muted chat-caption">
                  Powered by Gemini · Answers use your locally stored business records.
                </span>
              </div>
            </div>
          )}
          {active === "Inventory" && (
            <div className="subpage">
              <div className="eyebrow">BUSINESS OPERATIONS</div>
              <h1>Your <span>inventory.</span></h1>
              <p className="subtitle">Manage products, prices and stock levels in one place.</p>

              <div className="inventory-summary">
                <div className="inventory-stat">
                  <span>Total products</span>
                  <strong>{inventory.length}</strong>
                </div>
                <div className="inventory-stat">
                  <span>Healthy stock</span>
                  <strong>{inventory.filter((p) => p.stock > 20).length}</strong>
                </div>
                <div className="inventory-stat">
                  <span>Needs attention</span>
                  <strong>{inventory.filter((p) => p.stock <= 20).length}</strong>
                </div>
              </div>

              <div className="panel inventory-panel">
                <div className="panel-heading inventory-heading">
                  <div>
                    <h3>Product list</h3>
                    <p>{inventoryLoaded ? `${filteredProducts.length} products shown · Saved in this browser` : "Loading saved inventory..."}</p>
                  </div>
                  <div className="inventory-actions">
                    <input
                      className="search-input"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search products..."
                      aria-label="Search products"
                    />
                    <button className="inventory-add-button" onClick={openAddProduct}>
                      + Add product
                    </button>
                  </div>
                </div>

                {formOpen && (
                  <form className="product-form" onSubmit={saveProduct}>
                    <div className="product-form-heading">
                      <h3>{editingId ? "Edit product" : "Add a product"}</h3>
                      <button type="button" className="product-cancel" onClick={() => setFormOpen(false)}>Close ×</button>
                    </div>

                    <div className="product-form-grid">
                      <label>
                        Product name
                        <input required maxLength={70} value={draft.name}
                          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                          placeholder="e.g. Wheat Flour" />
                      </label>

                      <label>
                        Category
                        <select value={draft.category}
                          onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                          <option>Essentials</option>
                          <option>Grains</option>
                          <option>Pulses</option>
                          <option>Beverages</option>
                          <option>Dairy</option>
                          <option>Other</option>
                        </select>
                      </label>

                      <label>
                        Stock quantity
                        <input required type="number" min="0" step="1"
                          value={draft.stock}
                          onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
                          placeholder="0" />
                      </label>

                      <label>
                        Unit price (₹)
                        <input required type="number" min="0.01" step="0.01"
                          value={draft.price}
                          onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                          placeholder="e.g. 150" />
                      </label>
                    </div>

                    <button className="inventory-add-button" type="submit">
                      {editingId ? "Save changes" : "Add product"}
                    </button>
                  </form>
                )}

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>CATEGORY</th>
                        <th>STOCK</th>
                        <th>PRICE</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const status = getProductStatus(product.stock);
                        return (
                          <tr key={product.id}>
                            <td><strong>{product.name}</strong></td>
                            <td>{product.category}</td>
                            <td>{product.stock} units</td>
                            <td>{product.price}</td>
                            <td><span className={"status " + status.color}>{status.label}</span></td>
                            <td>
                              <div className="product-row-actions">
                                <button type="button" onClick={() => openEditProduct(product)}>Edit</button>
                                <button type="button" className="product-delete" onClick={() => deleteProduct(product.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="inventory-empty">
                            {inventory.length === 0 ? "No products yet. Add your first product." : "No products match your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="inventory-storage-note">Local browser storage · Demo data only · Not connected to a business database</p>
              </div>
            </div>
          )}

          {active === "Invoices" && (
            <div className="subpage invoice-page">
              <div className="eyebrow">DOCUMENT INTELLIGENCE</div>
              <h1>Invoice <span>management.</span></h1>
              <p className="subtitle">Track customer invoices, payments and outstanding amounts.</p>

              <div className="invoice-summary">
                <div className="invoice-summary-card">
                  <span className="invoice-summary-label">TOTAL INVOICES</span>
                  <strong>{invoices.length}</strong>
                  <span className="invoice-summary-foot">Recorded documents</span>
                </div>
                <div className="invoice-summary-card">
                  <span className="invoice-summary-label">PAID AMOUNT</span>
                  <strong>{"₹" + paidAmount.toLocaleString("en-IN")}</strong>
                  <span className="invoice-summary-foot">Successfully marked paid</span>
                </div>
                <div className="invoice-summary-card">
                  <span className="invoice-summary-label">OUTSTANDING</span>
                  <strong>{"₹" + outstandingAmount.toLocaleString("en-IN")}</strong>
                  <span className="invoice-summary-foot">Pending and overdue</span>
                </div>
              </div>

              <div className="inventory-panel invoice-panel">
                <div className="inventory-heading">
                  <div>
                    <h2>Invoice register</h2>
                    <p>Manage your customer billing records</p>
                  </div>
                  <button
                    type="button"
                    className="inventory-add-button"
                    onClick={openAddInvoice}
                    disabled={!invoicesLoaded}
                  >
                    + Add invoice
                  </button>
                </div>

                {invoiceFormOpen && (
                  <form className="product-form invoice-form" onSubmit={saveInvoice}>
                    <div className="product-form-heading">
                      <h3>{editingInvoiceId ? "Edit invoice" : "Create invoice"}</h3>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setInvoiceFormOpen(false);
                          setEditingInvoiceId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="product-form-grid">
                      <label>
                        Invoice number
                        <input
                          required
                          value={invoiceDraft.invoiceNumber}
                          onChange={(event) => setInvoiceDraft((previous) => ({
                            ...previous,
                            invoiceNumber: event.target.value
                          }))}
                          placeholder="INV-001"
                        />
                      </label>

                      <label>
                        Customer name
                        <input
                          required
                          value={invoiceDraft.customer}
                          onChange={(event) => setInvoiceDraft((previous) => ({
                            ...previous,
                            customer: event.target.value
                          }))}
                          placeholder="Customer name"
                        />
                      </label>

                      <label>
                        Amount (₹)
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={invoiceDraft.amount}
                          onChange={(event) => setInvoiceDraft((previous) => ({
                            ...previous,
                            amount: event.target.value
                          }))}
                          placeholder="2500"
                        />
                      </label>

                      <label>
                        Issue date
                        <input
                          required
                          type="date"
                          value={invoiceDraft.issueDate}
                          onChange={(event) => setInvoiceDraft((previous) => ({
                            ...previous,
                            issueDate: event.target.value
                          }))}
                        />
                      </label>

                      <label>
                        Due date
                        <input
                          required
                          type="date"
                          min={invoiceDraft.issueDate}
                          value={invoiceDraft.dueDate}
                          onChange={(event) => setInvoiceDraft((previous) => ({
                            ...previous,
                            dueDate: event.target.value
                          }))}
                        />
                      </label>

                      <label>
                        Payment status
                        <select
                          value={invoiceDraft.status}
                          onChange={(event) => setInvoiceDraft((previous) => ({
                            ...previous,
                            status: event.target.value as InvoiceStatus
                          }))}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </label>
                    </div>

                    <button type="submit" className="inventory-add-button">
                      {editingInvoiceId ? "Save changes" : "Save invoice"}
                    </button>
                  </form>
                )}

                <div className="invoice-toolbar">
                  <input
                    className="search-input"
                    type="search"
                    value={invoiceSearch}
                    onChange={(event) => setInvoiceSearch(event.target.value)}
                    placeholder="Search invoice or customer..."
                  />
                  <select
                    className="invoice-filter"
                    value={invoiceFilter}
                    onChange={(event) => setInvoiceFilter(event.target.value)}
                    aria-label="Filter invoices by payment status"
                  >
                    <option value="All">All statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>INVOICE</th>
                        <th>CUSTOMER</th>
                        <th>AMOUNT</th>
                        <th>ISSUED</th>
                        <th>DUE DATE</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td><strong>{invoice.invoiceNumber}</strong></td>
                          <td>{invoice.customer}</td>
                          <td>{"₹" + invoice.amount.toLocaleString("en-IN")}</td>
                          <td>{invoice.issueDate}</td>
                          <td>{invoice.dueDate}</td>
                          <td>
                            <span className={"status " + (
                              invoice.status === "Paid"
                                ? "green"
                                : invoice.status === "Overdue"
                                  ? "red"
                                  : "orange"
                            )}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <div className="product-row-actions">
                              <button type="button" onClick={() => openEditInvoice(invoice)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="product-delete"
                                onClick={() => deleteInvoice(invoice.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredInvoices.length === 0 && (
                        <tr>
                          <td colSpan={7} className="inventory-empty">
                            {invoices.length === 0
                              ? "No invoices yet. Add your first invoice."
                              : "No invoices match your search or filter."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="inventory-storage-note">
                  Local browser storage · Manual entries only · Not connected to a business database
                </p>
              </div>
            </div>
          )}
                    {active === "Insights" && (
                      <div className="subpage insights-page">
                        <div className="eyebrow">BUSINESS INTELLIGENCE</div>
                        <h1>See the <span>bigger picture.</span></h1>
                        <p className="subtitle">Clear summaries of your saved business records.</p>

                        <div className="insight-section-heading">
                          <div>
                            <h2>Business performance</h2>
                            <p>Understand your inventory and invoices at a glance.</p>
                          </div>
                          <span className="sample-tag">LOCAL BUSINESS DATA</span>
                        </div>

                        <div className="insight-stat-grid">
                          <div className="insight-stat-card">
                            <span>Total products</span>
                            <strong>{inventory.length}</strong>
                            <small>Products in your inventory</small>
                          </div>
                          <div className="insight-stat-card">
                            <span>Total stock units</span>
                            <strong>{inventory.reduce((sum, product) => sum + product.stock, 0).toLocaleString("en-IN")}</strong>
                            <small>Units currently recorded</small>
                          </div>
                          <div className="insight-stat-card">
                            <span>Paid invoices</span>
                            <strong>{invoices.filter((invoice) => invoice.status === "Paid").length}</strong>
                            <small>Invoices marked as paid</small>
                          </div>
                          <div className="insight-stat-card">
                            <span>Outstanding amount</span>
                            <strong>{"₹" + outstandingAmount.toLocaleString("en-IN")}</strong>
                            <small>Unpaid invoice value</small>
                          </div>
                        </div>

                        <div className="insight-two-column">
                          <section className="panel insight-panel">
                            <div className="panel-heading">
                              <div>
                                <h3>Inventory overview</h3>
                                <p>Current stock levels</p>
                              </div>
                            </div>
                            {inventory.length > 0 ? (
                              <div className="insight-simple-list">
                                {inventory.map((product) => (
                                  <div className="insight-simple-row" key={product.id}>
                                    <div><strong>{product.name}</strong><small>{product.category}</small></div>
                                    <strong>{product.stock} units</strong>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="insight-empty">Add products to see inventory information.</p>
                            )}
                          </section>

                          <section className="panel insight-panel">
                            <div className="panel-heading">
                              <div>
                                <h3>Invoice overview</h3>
                                <p>Saved invoice totals</p>
                              </div>
                            </div>
                            <div className="invoice-insight-row"><span>Total invoices</span><strong>{invoices.length}</strong></div>
                            <div className="invoice-insight-row"><span>Paid amount</span><strong>{"₹" + paidAmount.toLocaleString("en-IN")}</strong></div>
                            <div className="invoice-insight-row"><span>Outstanding</span><strong>{"₹" + outstandingAmount.toLocaleString("en-IN")}</strong></div>
                            <div className="invoice-insight-row"><span>Pending invoices</span><strong>{invoices.filter((invoice) => invoice.status === "Pending").length}</strong></div>
                            <div className="invoice-insight-row"><span>Overdue invoices</span><strong>{invoices.filter((invoice) => invoice.status === "Overdue").length}</strong></div>
                          </section>
                        </div>

                        <p className="insight-disclaimer">These summaries use records saved in this browser. They are not AI-generated forecasts or cloud-synced reports.</p>
                      </div>
                    )}
        </div>
      </section>
    </main>
  );
}
