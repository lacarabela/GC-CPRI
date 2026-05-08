# GC-CPRI: Composite Civic Participation Risk Index

## Project Overview

The **Composite Civic Participation Risk Index (GC-CPRI)** is a county-level analytical project focused on civic participation and access conditions across selected Alabama counties. The project combines public election, socioeconomic, demographic, geographic, and infrastructure-related data into a modeled composite score.

The index uses **Principal Component Analysis (PCA)** to identify overlapping patterns across multiple indicators and produce a normalized county risk score from 0 to 100. A higher score represents higher relative risk within the current comparison group, while a lower score represents lower relative risk within that same group.

This repository also includes an interactive web tool that allows users to explore the final scores and adjust indicator weights to better understand how different factors influence county-level results.

---

## Main Deliverables

1. **Python-Based Composite Risk Index**
   - Cleans and combines county-level source datasets
   - Builds modeling features for PCA
   - Runs PCA and creates normalized county scores
   - Exports final scoring tables, PCA loadings, and explained variance outputs

2. **Interactive Web Tool**
   - Hosted from the `docs/` folder using GitHub Pages
   - Built with HTML, CSS, and JavaScript
   - Uses exported CSV and JSON files from the Python workflow
   - Allows non-technical users to explore how indicator weights affect final county scores

3. **Documentation and Handoff Materials**
   - Explains the notebook workflow
   - Documents data inputs, generated outputs, and modeling assumptions
   - Supports future updates, review, and client handoff

---

## Repository Structure

```text
GC-CPRI/
│
├── data/
│   ├── cleaned/
│   │   ├── Alabama_SoS/
│   │   ├── USDA/
│   │   └── County Health Rankings Broadband/
│   ├── merged/
│   │   └── gc_cpri_model_input.csv
│   └── final/
│       ├── gc_cpri_scored_counties.csv
│       ├── gc_cpri_pca_loadings.csv
│       └── gc_cpri_explained_variance.csv
│
├── docs/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── data/
│       ├── gc_cpri_scores_for_app.csv
│       ├── gc_cpri_scores_for_app.json
│       └── gc_cpri_app_data_v2.json
│
├── documentation/
│   └── project documentation and handoff notes
│
├── notebooks/
│   ├── 01_merge_and_feature_build.ipynb
│   ├── 02_pca_analysis.ipynb
│   └── 03_final_outputs.ipynb
│
├── README.md
└── requirements.txt
```

---

## Notebook Workflow

The project is designed to be run in order from the `notebooks/` folder.

### 1. `01_merge_and_feature_build.ipynb`

This notebook prepares the county-level modeling dataset.

**Purpose:**
- Loads cleaned input files from Alabama Secretary of State, USDA, and County Health Rankings broadband datasets
- Standardizes column names and county names
- Selects and engineers variables needed for the index
- Merges all source datasets into one county-level modeling table
- Exports the merged model input file

**Main input folders:**
- `data/cleaned/Alabama_SoS/`
- `data/cleaned/USDA/`
- `data/cleaned/County Health Rankings Broadband/`

**Main output:**
- `data/merged/gc_cpri_model_input.csv`

---

### 2. `02_pca_analysis.ipynb`

This notebook creates the PCA-based composite index.

**Purpose:**
- Loads the merged modeling dataset
- Selects the PCA input indicators
- Aligns indicator direction so higher transformed values consistently represent higher risk
- Handles missing values using median imputation
- Standardizes variables before PCA
- Runs PCA and uses the first principal component as the basis for the index
- Normalizes the raw PCA score to a 0 to 100 scale
- Exports final county scores, PCA loadings, and explained variance

**Current PCA indicators:**
- `poverty_rate`
- `unemployment_rate`
- `median_income`
- `pct_less_hs`
- `non_white_share`
- `rural_urban_code`
- `broadband_access_rate`

**Important direction adjustments:**
- Higher poverty, unemployment, lower high school attainment, rural-urban code, and non-white voter share are treated as higher-risk conditions.
- Median household income is inverted because lower income represents higher risk.
- Broadband access is inverted because lower broadband access represents higher risk.

**Main inputs:**
- `data/merged/gc_cpri_model_input.csv`

**Main outputs:**
- `data/final/gc_cpri_scored_counties.csv`
- `data/final/gc_cpri_pca_loadings.csv`
- `data/final/gc_cpri_explained_variance.csv`

---

### 3. `03_final_outputs.ipynb`

This notebook prepares final files for reporting and the interactive web tool.

**Purpose:**
- Loads the final scored county file
- Creates county ranking views
- Exports simplified score files for the app
- Exports an expanded JSON file containing indicator metadata, transformed scoring information, county-level raw values, PCA loadings, and normalization parameters

**Main inputs:**
- `data/final/gc_cpri_scored_counties.csv`
- `data/final/gc_cpri_pca_loadings.csv`
- `data/merged/gc_cpri_model_input.csv`

**Main outputs:**
- `docs/data/gc_cpri_scores_for_app.csv`
- `docs/data/gc_cpri_scores_for_app.json`
- `docs/data/gc_cpri_app_data_v2.json`

---

## Methodology Summary

The GC-CPRI is a descriptive composite index. It is not intended to prove that any single condition causes lower or higher civic participation. Instead, it identifies counties where multiple risk-related conditions overlap.

The workflow follows these general steps:

1. **Collect and clean public county-level data** from election, socioeconomic, demographic, geographic, and broadband sources.
2. **Build a merged model input table** where each row represents one county and each column represents a selected indicator.
3. **Prepare indicators for PCA** by aligning each variable so that higher transformed values consistently represent higher relative risk.
4. **Standardize indicators** so variables measured on different scales can be compared in the PCA model.
5. **Run PCA** and use the first principal component as the main composite scoring dimension.
6. **Normalize scores** from 0 to 100 for easier interpretation and communication.
7. **Export final files** for documentation, reporting, and the interactive web application.

---

## How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/lacarabela/GC-CPRI.git
cd GC-CPRI
```

### 2. Create and activate a virtual environment

For Windows PowerShell:

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

For macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Open Jupyter Notebook

```bash
jupyter notebook
```

### 5. Run the notebooks in order

From the `notebooks/` folder, run:

1. `01_merge_and_feature_build.ipynb`
2. `02_pca_analysis.ipynb`
3. `03_final_outputs.ipynb`

The notebooks assume they are run from the `notebooks/` directory because they use `Path.cwd().parent` to locate the project root.

---

## Interpreting the Score

The final `gc_cpri_score` is normalized from 0 to 100.

- **100** represents the highest relative risk score among the counties currently included in the model.
- **0** represents the lowest relative risk score among the counties currently included in the model.
- Scores should be interpreted comparatively, not as absolute measures of civic participation risk.

A higher score generally reflects the overlap of multiple conditions such as higher poverty, higher unemployment, lower median income, lower educational attainment, higher rurality, lower broadband access, and relevant demographic patterns.

---

## Interactive Web Tool

The interactive web tool is published through GitHub Pages and can be accessed here:

[Open the GC-CPRI Web Tool](https://lacarabela.github.io/GC-CPRI/)

The web tool is stored in the `docs/` folder so it can be published through GitHub Pages.

The tool uses the exported app-ready files from `03_final_outputs.ipynb`, especially:

- `docs/data/gc_cpri_scores_for_app.csv`
- `docs/data/gc_cpri_scores_for_app.json`
- `docs/data/gc_cpri_app_data_v2.json`

When updating the model, rerun the notebooks in order so the web app reflects the latest scores and indicator metadata.

---

## Key Limitations

- The index is limited to the counties and datasets currently included in the project.
- The score is descriptive and should not be interpreted as causal evidence.
- Results depend on the selected indicators, transformations, and PCA weighting structure.
- Scores are relative to the current comparison group. Adding or removing counties can change the normalized 0 to 100 scale.
- Public datasets may have missing values, inconsistent naming conventions, or different reporting years.

---

## Requirements

Core Python dependencies are listed in `requirements.txt`.

Current major dependencies include:

- pandas
- numpy
- scikit-learn
- matplotlib
- jupyter / notebook / ipykernel

---

## Reproducibility Notes

To reproduce the current workflow:

1. Keep the cleaned source files in the expected folders under `data/cleaned/`.
2. Run the notebooks in the numbered order.
3. Review the exported files in `data/merged/`, `data/final/`, and `docs/data/`.
4. Commit updated outputs only after confirming that the model results and app files reflect the intended version.

---

## Project Status

