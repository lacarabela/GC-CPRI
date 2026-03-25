# GC-CPRI: Composite Civic Participation Risk Index

## Project Overview
This project develops a statistically modeled Composite Civic Participation Risk Index (GC-CPRI) to analyze patterns related to civic participation and access across Alabama counties. The index is constructed using publicly available datasets and applies statistical techniques, including Principal Component Analysis (PCA), to generate a composite score that reflects relative levels of risk.

In addition to the analytical model, this repository also hosts an interactive web-based tool that allows users to explore the index and understand trade-offs between different contributing factors.

---

## Deliverables
This repository contains two primary deliverables:

1. **Composite Risk Index (Python-Based)**
   - Data collection, cleaning, and transformation pipeline
   - PCA-based modeling approach
   - Final composite scores at the county level

2. **Interactive Web Application (GitHub Pages)**
   - Built using HTML, CSS, and JavaScript
   - Allows users to explore results and adjust weights
   - Designed for accessibility to non-technical users

---

## Repository Structure
The repository is organized to clearly separate data, analysis, documentation, and the interactive application while maintaining reproducibility and transparency.

```
gc-cpri/
│
├── data/                          # All datasets used in the project
│   ├── raw/                       # Original, unmodified source data
│   └── cleaned/                   # Cleaned and preprocessed datasets
│
├── notebooks/                     # Jupyter notebooks for step-by-step analysis
│   ├── 01_data_collection.ipynb
│   ├── 02_data_cleaning.ipynb
│   ├── 03_feature_preparation.ipynb
│   ├── 04_pca_analysis.ipynb
│   └── 05_final_index_generation.ipynb
│
├── src/                           # Reusable Python scripts
│   ├── data_processing/           # Data loading, cleaning, and transformation
│   ├── analysis/                  # PCA modeling and index scoring
│   └── utils/                     # Helper functions and configuration
│
├── app/                           # Interactive web application (GitHub Pages)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── data/                      # JSON or formatted data for the app
│
├── docs/                          # Project documentation
│   ├── methodology.md
│   ├── xxx.md 
│   ├── xxx.md
│   └── xxx.md
│
├── README.md                      # Project overview and instructions
├── requirements.txt               # Python dependencies
└── .gitignore
```

### Data Folder Structure

Each dataset in the `data/raw/` directory follows a consistent structure to ensure transparency and reproducibility:

```
data/raw/
└── dataset_name/
    ├── dataset_file.csv
    ├── data_dictionary.md    # Variable definitions and descriptions
    └── source_notes.md       # Source, collection method, and notes
```

This structure ensures that all data sources are well-documented, traceable, and easy to understand for both technical and non-technical users.

## Methodology Summary
