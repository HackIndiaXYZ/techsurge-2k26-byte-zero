# SenseLog — AI-Powered Neural Logistics & Autonomous Supply Chain Engine

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15+-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Quantile_Regression-2E7D32?style=for-the-badge)](https://xgboost.readthedocs.io/)
[![HuggingFace](https://img.shields.io/badge/Transformers-DistilBERT-FFAA00?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)

---

## 📌 Executive Summary

**SenseLog** is an end-to-end, multi-echelon autonomous supply chain intelligence and logistics command platform. It fuses **Deep Learning time-series forecasting (LSTM)**, **probabilistic uncertainty modeling (Quantile XGBoost)**, **unsupervised anomaly detection (Isolation Forest)**, **Natural Language Processing (DistilBERT)**, and **automated dual-tier cargo dispatch algorithms** into a unified, cyber-aesthetic operational dashboard with real-time 3D geospatial telemetry.

Designed to eliminate stockouts, minimize dead stock, and streamline purchase order approvals across distributed retail stores (Mumbai, Delhi, Chennai), SenseLog transforms raw point-of-sale (POS) data into actionable reorder schedules, vendor allocations, and inventory health ratings.

---

## 🌟 Key Capabilities

### 1. 🧠 Multi-Echelon Neural Demand Forecasting (LSTM)
- Sequential **LSTM neural network** (`keras.models.Sequential` with 128 & 64 units, Dropout, Adam optimizer) operating on 7-day rolling window sequences.
- Jointly tracks and predicts **Scaled Demand**, **Visible Shelf Stock**, and **Backroom Inventory**.
- Simulates daily retail shelf replenishment (`move_to_visible_threshold = 2`), calculating precise stock depletion curves and reorder trigger dates across a 30-day projection horizon.
- Evaluates aggregate SKU revenue vs. cost margins for every forecasted replenishment cycle.

### 2. 📊 Probabilistic Quantile Forecasting (XGBoost)
- Trains tri-quantile regression models ($\alpha = 0.1, 0.5, 0.9$) to generate **P10 (Lower Bound)**, **P50 (Point Forecast)**, and **P90 (Upper Bound)** demand intervals.
- Quantifies sales volatility ($\sigma / \mu$) and bounds uncertainty, producing confidence scores and explainability matrices (feature gain analysis for Store Location, Product Popularity, Category Seasonality, Shelf Stock, and Daily Rhythm).
- Auto-flags SKUs for human review when confidence drops below 60% or when demand exceeds combined inventory.

### 3. 🚨 Anomaly Sentinel (Isolation Forest)
- Unsupervised **Isolation Forest** algorithms continuously monitor store transaction feeds for abnormal demand spikes, panic buying, or promotional anomalies.
- Real-time alerting pipeline streams detected anomalies directly to the Commander HQ Dashboard.

### 4. 💬 Transformer Sentiment Intelligence (DistilBERT)
- Leverages Hugging Face's `distilbert-base-uncased-finetuned-sst-2-english` transformer pipeline to process customer reviews and store feedback.
- Computes granular sentiment confidence scores that feed into store rankings and dynamically modulate expedited shipping allocations.

### 5. 🏆 Neural Store Performance Ranker
- PyTorch **Linear Ranking Model** (`ranking_model.pth`) combines normalized monthly sales totals, review volumes, and sentiment indices to generate weighted multi-metric store health rankings.

### 6. 🚚 Dynamic Dual-Track Cargo Shipping Optimization
- Algorithmic order partitioning: splits replenishment quantities into **Quick 5-Day Express** and **Standard 10-Day Freight**.
- Allocation ratio dynamically scales with store sentiment scores ($10\% + 15\% \times \text{sentiment}$).
- Automated vendor matching against `vendor.csv` by reliability ratings and lead-time constraints, coupled with a milestone event tracking simulator.

### 7. 🌐 Interactive 3D Geospatial Command Center (Three.js WebGL)
- High-performance 3D Earth visualization rendered with `@react-three/fiber` and `@react-three/drei`.
- Live pulsating markers, animated logistics arcs between major regional fulfillment hubs (Mumbai, Delhi, Chennai, Bangalore, Kolkata), and real-time network telemetry.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Data Layer
        POS[Store POS Feeds: CSV / Excel]
        Reviews[Customer Reviews: shop_reviews.csv]
        Vendors[Vendor Catalog: vendor.csv]
    end

    subgraph AI/ML Intelligence Pipeline
        LSTM[LSTM Multi-Echelon Forecaster\nkeras shop1/2/3_model.h5]
        XGB[Quantile XGBoost Engine\nP10 / P50 / P90 Regressors]
        IsoForest[Anomaly Sentinel\nIsolation Forest]
        BERT[Sentiment NLP\nDistilBERT SST-2]
        Ranker[PyTorch Store Ranker\nranking_model.pth]
        Cargo[Optimal Cargo Dispatcher\nDual-Speed Freight Optimizer]
    end

    subgraph Backend API [Python / Flask :8008]
        API[demandapi.py REST Server]
        Endp1["/rankings, /status, /summary"]
        Endp2["/forecast/<shop>/<product>"]
        Endp3["/inventory/<shop>, /reviews/<shop>"]
        Endp4["/anomalies, /surges, /orders"]
        Endp5["/shipping/plan, /order/<product>"]
    end

    subgraph Frontend Application [React 18 + Vite :5173]
        Three[3D WebGL Globe Telemetry\nGlobeScene.tsx]
        Landing[Landing Page & Pipeline Tour]
        HQ[Commander Dashboard\nStore Rankings & Live Anomaly Sentinel]
        Store[Store Operations Dashboard\n30-Day Forecast & Stockout Curves]
        Orders[Order Nexus\nInline PO Overrides & Dispatch]
    end

    POS --> LSTM
    POS --> XGB
    POS --> IsoForest
    Reviews --> BERT
    BERT --> Ranker
    LSTM & XGB & IsoForest --> API
    Ranker & Cargo --> API
    Vendors --> Cargo

    API --> Endp1 & Endp2 & Endp3 & Endp4 & Endp5
    Endp1 & Endp2 & Endp3 & Endp4 & Endp5 --> Frontend Application
    Frontend Application --> Three & Landing & HQ & Store & Orders
```

---

## 📂 Codebase Directory Structure

```plaintext
SupplyChain/
├── backend/                              # Python Flask API & Machine Learning Engine
│   ├── check_api.py                      # Health-check script for Flask REST endpoints
│   ├── check_forecast.py                 # Diagnostic script for forecasting API
│   ├── demandapi.py                      # Core Flask REST server (Port 8008)
│   ├── diag_inventory.py                 # Inventory dataset verification utility
│   ├── finalstore1.py                    # Shop A (Mumbai) LSTM demand model & simulator
│   ├── finalstore2.py                    # Shop B (Delhi) LSTM demand model & simulator
│   ├── finalstore3.py                    # Shop C (Chennai) LSTM demand model & simulator
│   ├── forecasting_engine.py             # Quantile XGBoost regression engine (P10/P50/P90)
│   ├── futuredemand.py                   # PyTorch MLP demand predictor & Isolation Forest
│   ├── futuredemand_model.pth            # Pre-trained PyTorch weights for Future Demand
│   ├── graphplot.py                      # Matplotlib/Seaborn visualization scripts
│   ├── intelligence_utils.py             # Shared ML utils (BERT inference, anomaly scoring)
│   ├── models.py                         # PyTorch DemandLSTM sequence definition
│   ├── optimal_cargoshipping.py          # Dual-tier freight optimizer & vendor dispatcher
│   ├── productorder.py                   # Automated batch purchase order generator
│   ├── ranking_model.pth                 # Pre-trained weights for Linear Ranking Model
│   ├── rankingmodel.py                   # Store performance ranking algorithm
│   ├── requirements.txt                  # Python dependencies
│   ├── shop1_model.h5                    # Trained Keras LSTM model for Shop A
│   ├── shop2_model.h5                    # Trained Keras LSTM model for Shop B
│   ├── shop3_model.h5                    # Trained Keras LSTM model for Shop C
│   ├── test_stores.py                    # Multi-store API validation script
│   ├── unified_forecasting_engine.py     # Aggregated 4-week forecast & review logic
│   │
│   ├── [Datasets & Generated ML Artifacts]
│   ├── day1.csv ... day7.csv             # Daily transaction logs
│   ├── demand_anomalies.csv              # Flagged sales anomalies from Isolation Forest
│   ├── demand_data.csv                   # Historical demand records
│   ├── demand_predictions.csv            # PyTorch MLP inference predictions
│   ├── master_demand_intelligence.csv    # Consolidated intelligence reporting table
│   ├── orders.csv                        # Active and historical purchase orders
│   ├── shop_1_combined.csv               # Merged POS & inventory data for Shop A
│   ├── shop_2.csv / shop2_combined.csv   # POS & inventory data for Shop B
│   ├── shop_3.csv                        # POS & inventory data for Shop C
│   ├── shop_reviews.csv                  # Raw customer feedback dataset
│   ├── shop_reviews_advanced.csv         # DistilBERT scored sentiment dataset
│   ├── shop_sale.csv                     # Aggregate store sales records
│   ├── storedata.xlsx                    # Master catalog & store reference data
│   ├── vendor.csv                        # Vendor catalog (ratings, lead times, costs)
│   └── weekly_forecast_report.csv        # XGBoost quantile forecast output
│
├── frontend/                             # React 18 / TypeScript Web Client
│   ├── public/                           # Static assets, icons, and 3D textures
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/
│   │   │   │   └── GlobeScene.tsx        # Interactive Three.js 3D WebGL Globe
│   │   │   ├── ui/                       # Radix UI primitives (Dialog, Tabs, Toast, etc.)
│   │   │   ├── GlassTooltip.tsx          # Custom glowing glassmorphic tooltip component
│   │   │   ├── Navbar.tsx                # Cyber-aesthetic navigation bar
│   │   │   └── NavLink.tsx               # Active route link handler
│   │   ├── data/
│   │   │   └── mockData.ts               # Fallback mock data and store configurations
│   │   ├── hooks/                        # Custom React hooks (use-toast, use-mobile)
│   │   ├── lib/
│   │   │   ├── api.ts                    # Typed API client interfacing with Flask backend
│   │   │   └── utils.ts                  # Tailwind clsx/twMerge utility functions
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx           # Hero page with 3D Globe, stats, & pipeline tour
│   │   │   ├── CommanderDashboard.tsx    # HQ Commander: Store rankings & anomaly sentinel
│   │   │   ├── StoreDashboard.tsx        # Store-level 30-day forecast, stockout curves
│   │   │   ├── OrderNexus.tsx            # Purchase order nexus with inline qty & shipping
│   │   │   └── NotFound.tsx              # 404 page
│   │   ├── store/
│   │   │   └── appStore.ts               # Zustand global store (roles, active store)
│   │   ├── App.tsx                       # React Router & React Query provider setup
│   │   ├── index.css                     # Design system tokens (cyan glow, glassmorphism)
│   │   └── main.tsx                      # DOM entrypoint
│   ├── .env                              # Frontend environment config
│   ├── package.json                      # Node dependencies and build scripts
│   ├── tailwind.config.ts                # Tailwind design system configuration
│   ├── tsconfig.json                     # TypeScript compiler configuration
│   └── vite.config.ts                    # Vite build & bundler configuration
│
├── playwright.config.ts                  # End-to-end testing configuration
├── playwright-fixture.ts                 # Test runner fixture definitions
└── README.md                             # Comprehensive project documentation
```

---

## 🤖 Machine Learning Ensemble Details

| Model / Subsystem | Technology | File / Artifact | Input Features | Output / Role |
| :--- | :--- | :--- | :--- | :--- |
| **Demand Sequence Forecaster** | Keras / TensorFlow (LSTM) | `finalstore1.py`<br>`finalstore2.py`<br>`finalstore3.py`<br>`shop[1-3]_model.h5` | 7-day rolling window: `Scaled Demand`, `Visible Stock`, `Inventory` | 30-day forward daily demand curve, shelf replenishment simulation, stockout dates |
| **Quantile Uncertainty Forecaster** | XGBoost (`reg:quantileerror`) | `forecasting_engine.py`<br>`weekly_forecast_report.csv` | Store Enc, Product Enc, Category Enc, Shelf Stock, Backroom Stock, Volatility | P10, P50, P90 forecast intervals, confidence scores, and feature importance drivers |
| **Market Trend Predictor** | PyTorch (Feedforward MLP) | `futuredemand.py`<br>`futuredemand_model.pth` | Seasonal encodings, promotions, competitor activity, review sentiment | 30-day future demand shift percentage and primary market catalyst identification |
| **Anomaly Sentinel** | Scikit-Learn (`IsolationForest`) | `futuredemand.py`<br>`intelligence_utils.py`<br>`demand_anomalies.csv` | Sales volume, promotional indicators, competitor activity flags | Detects uncharacteristic spikes (-1 flag) for real-time HQ triage |
| **Review Sentiment Engine** | Hugging Face Transformers | `rankingmodel.py`<br>`intelligence_utils.py`<br>`shop_reviews_advanced.csv` | Customer review text | Continuous sentiment scores ($0.0 \rightarrow 1.0$) using `distilbert-base-uncased-finetuned-sst-2-english` |
| **Store Performance Ranker** | PyTorch (Linear Neural Ranker) | `rankingmodel.py`<br>`ranking_model.pth` | Normalized Month, Average Sentiment, Review Count, Actual Sales | Store performance score driving leaderboard rankings and priority allocation |
| **Freight Allocation Optimizer** | Python Heuristic Engine | `optimal_cargoshipping.py`<br>`productorder.py` | Store sentiment, SKU reorder urgency, vendor lead times & reliability | Dual-speed dispatch: Quick 5-day express vs Standard 10-day freight breakdown |

---

## 📡 REST API Reference

The backend Flask API server runs by default on `http://localhost:8008` (CORS enabled).

### Endpoint Catalog

| Method | Endpoint | Description | Sample Query / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | System health check and engine status | `—` |
| `GET` | `/status` | Network telemetry for all connected stores | `—` |
| `GET` | `/rankings` | Store performance rankings, sentiment scores, and stock health | `—` |
| `GET` | `/inventory/<shop_id>` | Latest shelf and warehouse inventory for store `A`, `B`, or `C` | `shop_id`: `a`, `b`, or `c` |
| `GET` | `/reviews/<shop_id>` | Customer reviews with star ratings and sentiment classifications | `shop_id`: `a`, `b`, or `c` |
| `GET` | `/forecast/<shop_id>/<product_name>` | 30-day LSTM & 4-week unified forecast, confidence score, and drivers | `shop_id`: `A`, `product_name`: `Sofa` |
| `GET` | `/anomalies` | Feed of recently detected demand anomalies across all stores | `—` |
| `GET` | `/summary` | Executive summary: critical stockouts, profit drivers, and stats | `—` |
| `GET` | `/orders` | Complete list of active and scheduled purchase orders | `—` |
| `POST` | `/order/<product_name>` | Triggers demand calculation and generates purchase orders for SKU | `product_name`: `Laptop` |
| `GET` | `/vendors/<product_name>` | Eligible suppliers ranked by reliability rating and delivery speed | `product_name`: `Basmati Rice` |
| `GET` | `/surges` | Filtered demand surges with driving factor explanations | `?shop=a&product=Sofa` |
| `GET` | `/shipping/plan/<product_name>/<shop_id>` | Computes optimal Quick (5-day) vs Normal (10-day) dispatch plan | `?qty=50&quick=true` |

---

## 💻 Installation & Quickstart

### Prerequisites
- **Node.js** (v18.0 or higher) and **npm** / **bun**
- **Python** (v3.10 or higher)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/RoyIshanBarman/SupplyChain.git
cd SupplyChain
```

---

### Step 2: Set Up & Launch the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv env
   .\env\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv env
   source env/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask API server:
   ```bash
   python demandapi.py
   ```
   *The backend will initialize pre-trained models and start listening on `http://localhost:8008`.*

---

### Step 3: Set Up & Launch the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Ensure `frontend/.env` points to your backend server:
   ```env
   VITE_API_BASE_URL=http://localhost:8008
   ```
   *(If accessing over a local network, replace `localhost` with your machine's LAN IP address).*

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 🖥️ Operational Portals Walkthrough

### 🚀 Landing Page (`/`)
- Interactive **3D WebGL Globe** powered by Three.js displaying supply chain hubs across India with dynamic telemetry arcs.
- Live metric ticker displaying real-time system accuracy (98.3%), active anomaly sentinel, and automated replenishment status.
- Comprehensive 4-step walkthrough of the **SenseLog Pipeline**: *Data Sync $\rightarrow$ Anomaly Scan $\rightarrow$ Neural Prediction $\rightarrow$ Auto-Reorder*.

### 🛡️ Commander Dashboard (`/owner`)
- **Anomaly Sentinel Feed**: Live-scrolling security feed flagging sudden consumption surges and stock irregularities.
- **Store Rankings**: Real-time leaderboard evaluating Store A (Mumbai), Store B (Delhi), and Store C (Chennai) based on sentiment, 7-day revenue, and stock health.
- **Network Telemetry**: Hub connectivity status, active SKU tallies, and sync timestamps.

### 🏬 Store Operations Dashboard (`/store/:storeId`)
- **30-Day Demand Trajectory**: Visualized using Recharts with actual vs. predicted curves.
- **Stockout Risk Predictor**: Calculates expected stockout day when projected consumption outpaces available shelf and backroom units.
- **Inventory Capacity Gauge**: Visual distribution of items on visible display shelves vs. warehouse stockrooms.
- **DistilBERT Sentiment Radar**: Multi-axis radar diagram tracking customer sentiment across *Quality*, *Delivery*, *Price*, *Availability*, and *Service*.

### 📦 Order Nexus (`/orders`)
- AI-recommended replenishment queue specifying required reorder dates and quantities.
- **Dual-Tier Freight Splitting**: Visual breakdown between Quick Delivery (5 days via prioritized vendors) and Standard Freight (10 days).
- **Interactive Inline Overrides**: Modify quantities directly in the table with instant automatic rebalancing between quick and standard allocations.
- **Vendor Selector**: Dropdown showing supplier reliability metrics and lead times.
- **One-Click Dispatch**: Submits orders directly to the execution pipeline.

---

## 🛠️ CLI Diagnostics & Standalone Tools

The `backend` directory includes standalone scripts for testing, batch modeling, and data diagnostics:

| Command | Description |
| :--- | :--- |
| `python optimal_cargoshipping.py` | Interactive CLI for reviewing orders, calculating quick delivery percentages, and generating shipping dispatch manifests. |
| `python productorder.py` | Batch execution script that evaluates all SKUs across all three stores and updates `orders.csv`. |
| `python unified_forecasting_engine.py` | Command-line SKU forecast generator with confidence scores and human-in-the-loop review recommendations. |
| `python forecasting_engine.py` | Executes the Quantile Regression pipeline and generates `weekly_forecast_report.csv`. |
| `python futuredemand.py` | Runs PyTorch MLP inference and executes an Isolation Forest anomaly scan. |
| `python test_stores.py` | Automated HTTP smoke test verifying inventory and review endpoints for Stores A, B, and C. |
| `python check_api.py` | Validates all primary Flask endpoints and outputs formatted JSON responses. |
| `python check_forecast.py` | Validates forecast responses for individual SKUs across all stores. |
| `python diag_inventory.py` | Checks CSV date parsing integrity and counts items at the latest timestamp. |
| `python graphplot.py` | Generates distribution boxplots, top SKU demand charts, and time-series plots with Seaborn. |

---

## 🧪 Testing & Quality Assurance

- **Unit & Component Testing**:
  ```bash
  cd frontend
  npm run test
  ```
- **Linting & Code Style**:
  ```bash
  cd frontend
  npm run lint
  ```
- **End-to-End Testing (Playwright)**:
  ```bash
  npx playwright test
  ```

---

## 🎨 Design System & Aesthetics

SenseLog is crafted with a futuristic **Cyber-Logistics Glassmorphic Design System**:
- **Typography**: `Orbitron` for high-tech telemetry headers and numerical readouts; `DM Sans` for clean data tables and interface controls.
- **Color Tokens**:
  - `Primary Cyan` (`hsl(187, 86%, 53%)`): Active circuits, predictions, and primary actions.
  - `Alert Red` (`hsl(0, 72%, 51%)`): Anomaly detection and urgent stockout warnings.
  - `Warning Amber` (`hsl(38, 92%, 50%)`): Review recommendations and medium-priority orders.
  - `Success Emerald` (`hsl(160, 60%, 45%)`): Healthy stock levels and top ratings.
- **Backdrop Blur & Glows**: Multi-layer glass cards (`backdrop-blur-xl`, `rgba(255, 255, 255, 0.05)`) with custom glow shadows (`--glow-cyan`, `--glow-red`).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

This project is licensed under the **MIT License** — see the LICENSE file for details.
