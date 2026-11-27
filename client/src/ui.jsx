import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const ToastContext = createContext(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = "ok") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && <div className={`flash toast ${toast.type}`}>{toast.message}</div>}
    </ToastContext.Provider>
  );
}

export function useData(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setError(null);
    api
      .get(url)
      .then((result) => live && setData(result))
      .catch((err) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, reload };
}

export function guard(data, error) {
  if (error) return <div className="flash err">{error}. Check that the API server is running and the database settings are correct.</div>;
  if (!data) return <p className="muted">Loading</p>;
  return null;
}

export function useAction() {
  const toast = useToast();
  return async (fn, message) => {
    try {
      const result = await fn();
      if (message) toast(message);
      return result ?? true;
    } catch (err) {
      toast(err.message, "err");
      return false;
    }
  };
}

export const bind = (state, setState) => (key) => ({
  value: state[key],
  onChange: (event) => setState({ ...state, [key]: event.target.value }),
});

const dateOptions = { day: "2-digit", month: "short", year: "numeric" };

export const fmtDate = (value) => {
  if (!value) return "";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", dateOptions);
};

export const fmtDateTime = (value) => {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date.toLocaleDateString("en-GB", dateOptions)}, ${time}`;
};

export const Badge = ({ value }) => <span className={`badge ${String(value).toLowerCase()}`}>{value}</span>;

export const Meter = ({ value }) => (
  <div className="meter">
    <div className="bar amber">
      <i style={{ width: `${value || 0}%` }} />
    </div>
    <b>{value ?? 0}%</b>
  </div>
);

export const PageHead = ({ title, subtitle, children }) => (
  <div className="page-head">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {children}
  </div>
);
