import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./wagmi";
import App from "./App";
import "./styles.css";

const qc = new QueryClient({ defaultOptions: { queries: { retry: 3, retryDelay: (n) => Math.min(1000 * 2 ** n, 8000), staleTime: 15_000, refetchOnReconnect: true } } });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}><QueryClientProvider client={qc}><App /></QueryClientProvider></WagmiProvider>
  </React.StrictMode>,
);
