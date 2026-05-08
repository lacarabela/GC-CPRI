# GC-CPRI PCA Methodology Documentation

## Composite Civic Participation Risk Index

**Project:** GC-CPRI, Composite Civic Participation Risk Index  
**Primary audience:** SPLC client team, project reviewers, future maintainers, and technical handoff users  
**Repository:** `GC-CPRI`  
**Primary notebooks:**

1. `notebooks/01_merge_and_feature_build.ipynb`
2. `notebooks/02_pca_analysis.ipynb`
3. `notebooks/03_final_outputs.ipynb`

---

## 1. Purpose of This Documentation

This document explains the full PCA workflow used to build the GC-CPRI model. It is intended to help the client understand how the final composite civic participation risk scores are produced, what data sources are used, how variables are transformed, how the PCA model is run, and how outputs are prepared for both analysis and the interactive web tool.

The goal is to make the methodology transparent, reproducible, and maintainable after project handoff. A future user should be able to read this document, rerun the notebooks in order, understand what each notebook does, and know where the final outputs are created.

---

## 2. Project Summary

The GC-CPRI model creates a county-level composite score for Alabama counties. The score is designed to identify relative civic participation risk by combining several socioeconomic, demographic, geographic, infrastructure, and civic participation indicators into one index.

The model uses Principal Component Analysis, commonly abbreviated as PCA, to combine correlated indicators into a single composite score. PCA is useful here because it allows the model to identify shared patterns across multiple variables instead of relying on one factor alone.

The index is descriptive. It does not claim that any single variable causes civic participation outcomes. Instead, it highlights counties where multiple risk-related conditions overlap.

---

## 3. High-Level Workflow

The PCA workflow has three main stages:

1. **Merge and feature build**
   - Load cleaned source datasets.
   - Standardize county names and column names.
   - Create derived indicators.
   - Merge all selected indicators into one county-level modeling file.

2. **PCA analysis**
   - Load the merged modeling dataset.
   - Select the PCA input variables.
   - Align all variables so higher transformed values represent higher risk.
   - Impute missing values.
   - Standardize variables.
   - Run PCA.
   - Convert the first principal component into a 0 to 100 score.

3. **Final outputs and web app data**
   - Load scored county results.
   - Generate rankings and summary statistics.
   - Export CSV and JSON files used by the interactive GitHub Pages web tool.
   - Export metadata needed for the app to recompute scores when users adjust weights.

---

## 4. Notebook Execution Order

The notebooks must be run in this order:

```text
01_merge_and_feature_build.ipynb
02_pca_analysis.ipynb
03_final_outputs.ipynb
```

Each notebook depends on outputs from the previous notebook. Running them out of order may result in missing files, outdated scores, or web app data that does not match the latest model.

---

## 5. Repository Folders Used by the PCA Workflow

The workflow expects the following general folder structure:

```text
GC-CPRI/
│
├── data/
│   ├── cleaned/
│   │   ├── Alabama_SoS/
│   │   ├── USDA/
│   │   └── County Health Rankings Broadband/
│   │
│   ├── merged/
│   │   └── gc_cpri_model_input.csv
│   │
│   └── final/
│       ├── gc_cpri_scored_counties.csv
│       ├── gc_cpri_pca_loadings.csv
│       └── gc_cpri_explained_variance.csv
│
├── docs/
│   └── data/
│       ├── gc_cpri_scores_for_app.csv
│       ├── gc_cpri_scores_for_app.json
│       └── gc_cpri_app_data_v2.json, if retained by app version
│
├── notebooks/
│   ├── 01_merge_and_feature_build.ipynb
│   ├── 02_pca_analysis.ipynb
│   └── 03_final_outputs.ipynb
│
├── README.md
└── requirements.txt
```

The notebooks use relative paths based on the repository root. They assume the notebooks are run from inside the `notebooks/` folder so that `Path.cwd().parent` points to the project root.

---

## 6. Input Data Sources

The workflow uses cleaned source files from three main folders.

### 6.1 Alabama Secretary of State Election Data

Folder:

```text
data/cleaned/Alabama_SoS/
```

Files used:

```text
2024 General Election Total Ballots Cast.csv
2024 General Election Participation by Race.csv
2020 General Election Participation by Race.csv
2024 General Election Participation by Age.csv
2024 General Election Participation by Gender.csv
```

Current use in the PCA workflow:

- Total ballots and registered voters are used to calculate voter turnout and absentee voting rates.
- Race participation data from 2024 and 2020 is used to estimate `non_white_share`.
- Age and gender data are loaded and inspected, but they are not currently part of the final PCA feature list.

### 6.2 USDA County-Level Data

Folder:

```text
data/cleaned/USDA/
```

Files used:

```text
Educational attainment for adults age 25 and older for the United States, States, and counties, 1970–2023.csv
Population estimates for the United States, States, and counties, 2020–23.csv
Poverty estimates for the United States, States, and counties, 2023.csv
Unemployment and median household income for the United States, States, and counties, 2000–23.csv
```

Current use in the PCA workflow:

- Education data is used to create `pct_less_hs` and `pct_bachelors`.
- Population data is used to create a multi-year average population measure and extract the 2023 Rural-Urban Continuum Code.
- Poverty data is used to create `poverty_rate`.
- Income and unemployment data are used to create `median_income` and a multi-year average `unemployment_rate`.

### 6.3 County Health Rankings Broadband Data

Folder:

```text
data/cleaned/County Health Rankings Broadband/
```

Files used:

```text
CLEANED alabama-2021-broadband-access-county-sort.csv
CLEANED alabama-2022-broadband-access-county-sort.csv
CLEANED alabama-2023-broadband-access-county-sort.csv
CLEANED alabama-2024-broadband-access-county-sort.csv
CLEANED alabama-2025-broadband-access-county-sort.csv
```

Current use in the PCA workflow:

- Broadband access values are converted from percent strings into decimals.
- Broadband access is averaged across 2021 through 2025.
- In the PCA notebook, broadband access is inverted so that lower broadband access becomes higher risk.

---

## 7. Notebook 01: Merge and Feature Build

Notebook:

```text
notebooks/01_merge_and_feature_build.ipynb
```

### 7.1 Purpose

This notebook creates the model input dataset used by the PCA notebook. It loads cleaned datasets, standardizes fields, creates derived features, merges all selected variables by county, and exports the merged modeling file.

Output file:

```text
data/merged/gc_cpri_model_input.csv
```

### 7.2 Main Steps

#### Step 1: Import packages

The notebook imports:

```python
import pandas as pd
import numpy as np
from pathlib import Path
```

`pandas` is used for data loading, cleaning, merging, and exporting. `numpy` supports numerical operations. `pathlib` is used to build file paths in a consistent way.

#### Step 2: Define directories and source files

The notebook defines the project root and cleaned data folders:

```python
BASE_DIR = Path.cwd().parent
DATA_DIR = BASE_DIR / "data" / "cleaned"
AL_SOS_DIR = DATA_DIR / "Alabama_SoS"
USDA_DIR = DATA_DIR / "USDA"
CHRB_DIR = DATA_DIR / "County Health Rankings Broadband"
```

It then defines the exact source files used in the workflow.

#### Step 3: Load datasets

Each cleaned CSV is loaded into a pandas DataFrame using `pd.read_csv()`.

The notebook loads:

- Ballots data
- Race participation data for 2024
- Race participation data for 2020
- Age participation data
- Gender participation data
- Education data
- Population data
- Poverty data
- Income and unemployment data
- Broadband access data for 2021 through 2025

#### Step 4: Inspect data shapes and columns

The notebook prints the shape and column names for each dataset. This serves as a basic validation step to confirm that each file loaded successfully and that expected fields are present.

#### Step 5: Clean column names

The function `clean_column_names()` standardizes all column names by:

- Stripping leading and trailing spaces
- Converting names to lowercase
- Replacing spaces with underscores
- Removing non-word characters

This reduces the chance of errors caused by inconsistent column naming across source files.

#### Step 6: Standardize county names

The function `standardize_county()` standardizes county names by:

- Converting names to uppercase
- Stripping extra spaces
- Removing `, AL`
- Removing ` COUNTY`

This is important because all datasets are merged by county. If county names are formatted differently across files, merges may fail or produce missing values.

#### Step 7: Pivot USDA datasets

The USDA files are structured in long format, where each row contains a county, an attribute name, and a value. The notebook converts them into wide format using `pivot_usda()` so each county becomes one row and each selected attribute becomes a column.

This makes the USDA files easier to merge with other county-level datasets.

---

## 8. Feature Engineering in Notebook 01

This section documents how each major modeling feature is created.

### 8.1 Voter Turnout and Absentee Voting

Source:

```text
2024 General Election Total Ballots Cast.csv
```

Created fields:

```text
turnout_rate
absentee_rate
```

Method:

```text
turnout_rate = turnout_as_a_percentage_of_registered_voters / 100
absentee_rate = absentee_as_percentage_of_total_ballots / 100
```

These fields are included in the merged model input file but are not currently included in the final PCA feature list.

### 8.2 Education

Source:

```text
Educational attainment for adults age 25 and older for the United States, States, and counties, 1970–2023.csv
```

Created fields:

```text
pct_less_hs
pct_bachelors
```

Method:

The notebook selects:

```text
Percent of adults who are not high school graduates, 2019-23
Percent of adults with a bachelor's degree or higher, 2019-23
```

These are renamed to:

```text
pct_less_hs
pct_bachelors
```

`pct_less_hs` is used in the PCA model. `pct_bachelors` is retained in the merged dataset but is not currently part of the PCA feature list.

### 8.3 Population

Source:

```text
Population estimates for the United States, States, and counties, 2020–23.csv
```

Created field:

```text
population_2023
```

Method:

The notebook extracts population estimates for 2020, 2021, 2022, and 2023, merges them by county, and averages them:

```text
population_2023 = average of POP_ESTIMATE_2020, POP_ESTIMATE_2021, POP_ESTIMATE_2022, POP_ESTIMATE_2023
```

Although the final field is named `population_2023`, it represents a four-year average across 2020 through 2023 in the current notebook.

This field is retained in the merged dataset but is not currently part of the final PCA feature list.

### 8.4 Rural-Urban Code

Source:

```text
Population estimates for the United States, States, and counties, 2020–23.csv
```

Created field:

```text
rural_urban_code
```

Method:

The notebook extracts:

```text
Rural_Urban_Continuum_Code_2023
```

and renames it to:

```text
rural_urban_code
```

This field is used in the PCA model. Higher values are treated as more rural and therefore higher risk in the current model logic.

### 8.5 Poverty Rate

Source:

```text
Poverty estimates for the United States, States, and counties, 2023.csv
```

Created field:

```text
poverty_rate
```

Method:

The notebook extracts:

```text
PCTPOVALL_2023
```

and renames it to:

```text
poverty_rate
```

This field is used in the PCA model. Higher poverty is treated as higher risk.

### 8.6 Non-White Voter Share

Sources:

```text
2024 General Election Participation by Race.csv
2020 General Election Participation by Race.csv
```

Created field:

```text
non_white_share
```

Method:

For each year, the notebook calculates:

```text
non_white_share_year = (total_ballots - total_white) / total_ballots
```

It then averages the 2024 and 2020 values:

```text
non_white_share = average of non_white_share_2024 and non_white_share_2020
```

This field is used in the PCA model.

Important note: this feature is based on voter participation records, not total county population demographics. It reflects the share of ballots cast by non-white voters in the available election participation files.

### 8.7 Unemployment Rate

Source:

```text
Unemployment and median household income for the United States, States, and counties, 2000–23.csv
```

Created field:

```text
unemployment_rate
```

Method:

The notebook extracts unemployment rates for 2020, 2021, 2022, and 2023, merges them by county, and averages them:

```text
unemployment_rate = average of Unemployment_rate_2020, Unemployment_rate_2021, Unemployment_rate_2022, Unemployment_rate_2023
```

This field is used in the PCA model. Higher unemployment is treated as higher risk.

### 8.8 Median Household Income

Source:

```text
Unemployment and median household income for the United States, States, and counties, 2000–23.csv
```

Created field:

```text
median_income
```

Method:

The notebook extracts:

```text
Median_Household_Income_2022
```

and renames it to:

```text
median_income
```

This field is used in the PCA model. In the PCA analysis notebook, it is multiplied by `-1` so that lower income corresponds to higher risk.

### 8.9 Broadband Access Rate

Sources:

```text
CLEANED alabama-2021-broadband-access-county-sort.csv
CLEANED alabama-2022-broadband-access-county-sort.csv
CLEANED alabama-2023-broadband-access-county-sort.csv
CLEANED alabama-2024-broadband-access-county-sort.csv
CLEANED alabama-2025-broadband-access-county-sort.csv
```

Created field:

```text
broadband_access_rate
```

Method:

For each year, the notebook:

1. Selects the county and `county_value` fields.
2. Renames `county_value` to a year-specific broadband field.
3. Removes the percent sign.
4. Converts the value to a decimal.
5. Averages 2021 through 2025.

Formula:

```text
broadband_access_rate = average of broadband_access_rate_2021 through broadband_access_rate_2025
```

This field is used in the PCA model. In the PCA analysis notebook, it is inverted as:

```text
1 - broadband_access_rate
```

This means lower broadband access becomes higher risk.

---

## 9. Final Merged Dataset

Notebook 01 merges all prepared features into a single county-level modeling dataset.

The merge starts with ballot data and then joins the following feature groups by county:

- Population
- Poverty
- Education
- Unemployment
- Median household income
- Race participation
- Rural-urban code
- Broadband access

The notebook then checks:

- Dataset information using `merged.info()`
- Missing values using `merged.isna().sum()`
- Summary statistics using `merged.describe()`

It drops duplicate percentage columns that were already converted into decimal rates:

```text
turnout_as_a_percentage_of_registered_voters
absentee_as_percentage_of_total_ballots
```

Final output:

```text
data/merged/gc_cpri_model_input.csv
```

This file is the required input for Notebook 02.

---

## 10. Notebook 02: PCA Analysis

Notebook:

```text
notebooks/02_pca_analysis.ipynb
```

### 10.1 Purpose

This notebook performs the PCA analysis and creates the final county-level GC-CPRI scores.

It loads the merged modeling dataset, selects the PCA variables, aligns all variables in the same risk direction, handles missing values, standardizes the data, runs PCA, exports model diagnostics, and saves final county scores.

Output files:

```text
data/final/gc_cpri_scored_counties.csv
data/final/gc_cpri_pca_loadings.csv
data/final/gc_cpri_explained_variance.csv
```

---

## 11. PCA Input Variables

The current PCA model uses seven indicators:

```text
poverty_rate
unemployment_rate
median_income
pct_less_hs
non_white_share
rural_urban_code
broadband_access_rate
```

### 11.1 Indicator Summary

| Indicator | Meaning | Risk Direction in Model |
|---|---|---|
| `poverty_rate` | County poverty rate | Higher poverty equals higher risk |
| `unemployment_rate` | Average unemployment rate across 2020 through 2023 | Higher unemployment equals higher risk |
| `median_income` | Median household income | Lower income equals higher risk |
| `pct_less_hs` | Percent of adults without a high school diploma | Higher value equals higher risk |
| `non_white_share` | Average non-white voter share across 2020 and 2024 election participation data | Higher value is treated as higher risk in the current model |
| `rural_urban_code` | 2023 Rural-Urban Continuum Code | Higher value is treated as more rural and higher risk |
| `broadband_access_rate` | Average broadband access rate across 2021 through 2025 | Lower access equals higher risk |

---

## 12. Risk Direction Alignment

Before PCA is run, the notebook transforms variables so they point in the same conceptual direction. This is necessary because PCA does not inherently know which values should represent higher or lower risk.

The model aligns variables so that higher transformed values generally represent higher risk.

### 12.1 Percent Scaling

The notebook checks whether these variables are stored as percentages greater than 1:

```text
poverty_rate
unemployment_rate
pct_less_hs
```

If the maximum value is greater than 1, the field is divided by 100.

Example:

```text
26.5 becomes 0.265
```

### 12.2 Median Income Transformation

Higher income is generally associated with lower risk in the current model logic. To align it with the other risk variables, the notebook multiplies median income by `-1`:

```text
median_income = -1 * median_income
```

After this transformation, lower original income becomes a higher transformed risk value.

### 12.3 Rural-Urban Code

The rural-urban code is left unchanged:

```text
rural_urban_code = rural_urban_code
```

Higher values are treated as more rural and higher risk.

### 12.4 Broadband Access Transformation

Higher broadband access is generally associated with lower risk. To align this variable with the risk direction, the notebook inverts broadband access:

```text
broadband_access_rate = 1 - broadband_access_rate
```

After this transformation, the field should be interpreted as limited broadband access rather than broadband access.

---

## 13. Missing Value Handling

The PCA notebook checks missing values using:

```python
pca_df.isna().sum()
```

It then uses median imputation:

```python
SimpleImputer(strategy="median")
```

This replaces missing values with the median value for that feature across counties.

Median imputation was selected because:

- It is simple and transparent.
- It is less sensitive to outliers than mean imputation.
- It allows all counties to remain in the PCA dataset instead of dropping rows.

Important limitation: if an entire feature column were missing, median imputation would not be sufficient. In that case, the source data or feature selection would need to be reviewed.

---

## 14. Standardization

After imputation, the notebook standardizes all PCA variables using:

```python
StandardScaler()
```

Standardization converts each feature into a z-score:

```text
z = (value - feature mean) / feature standard deviation
```

This step is required because the indicators use different units and scales. For example:

- Median income is measured in dollars.
- Poverty and unemployment are percentages.
- Rural-urban code is an integer classification.
- Broadband is a decimal share.

Without standardization, variables with larger numeric scales could dominate the PCA results.

---

## 15. Correlation Review

Before or during PCA review, the notebook calculates a correlation matrix:

```python
corr = X_imputed.corr()
```

This helps assess whether the selected indicators share enough relationships for PCA to be meaningful. PCA is most useful when multiple variables contain overlapping patterns.

This step is primarily diagnostic and does not directly change the final score.

---

## 16. Principal Component Analysis

The notebook runs PCA using scikit-learn:

```python
pca = PCA()
X_pca = pca.fit_transform(X_scaled)
```

No fixed number of components is specified, so PCA creates as many components as there are input variables.

Because there are seven PCA input variables, the model can produce up to seven principal components.

---

## 17. Explained Variance

The notebook creates an explained variance table:

```text
component
explained_variance_ratio
cumulative_variance
```

This table shows how much of the total variation in the standardized indicators is captured by each principal component.

The notebook also creates a scree plot to visualize the explained variance by component.

Output file:

```text
data/final/gc_cpri_explained_variance.csv
```

### 17.1 How to Interpret Explained Variance

- `explained_variance_ratio` shows the share of total variation captured by each component.
- `cumulative_variance` shows how much total variation is captured when components are added together in order.
- A high PC1 explained variance suggests that the first component captures a strong shared pattern across the selected indicators.

The GC-CPRI score currently uses PC1 only.

---

## 18. PCA Loadings

The notebook creates a loadings table:

```python
loadings = pd.DataFrame(
    pca.components_.T,
    index=X_imputed.columns,
    columns=[f"PC{i+1}" for i in range(pca.n_components_)]
)
```

Output file:

```text
data/final/gc_cpri_pca_loadings.csv
```

### 18.1 What Loadings Mean

PCA loadings show how strongly each input variable contributes to each principal component.

For PC1, loadings help explain what is driving the final GC-CPRI score. A larger absolute loading means the variable contributes more strongly to that component.

### 18.2 PC1 Loadings Bar Chart

The notebook creates a horizontal bar chart showing variables driving civic participation risk through PC1.

This chart is useful for presentations and client discussion because it makes the PCA output easier to interpret.

---

## 19. GC-CPRI Score Creation

The current GC-CPRI score is based on PC1.

The notebook stores the raw PC1 value as:

```text
gc_cpri_score_raw
```

Then it min-max normalizes the raw score to a 0 to 100 scale:

```text
gc_cpri_score = ((raw_score - raw_score_min) / (raw_score_max - raw_score_min)) * 100
```

### 19.1 Score Interpretation

The final score is relative to the counties included in the model run.

- A score of `100` represents the highest risk score in the current comparison group.
- A score of `0` represents the lowest risk score in the current comparison group.
- Scores between 0 and 100 show each county's relative position between those two endpoints.

Important note: this is not an absolute risk measure. If the counties, indicators, source data, or scoring method change, the normalized scores may also change.

---

## 20. Final PCA Outputs

Notebook 02 exports three files to `data/final/`.

### 20.1 Scored Counties

```text
data/final/gc_cpri_scored_counties.csv
```

Contains the original merged county dataset plus PCA scoring fields, including:

```text
gc_cpri_score_raw
gc_cpri_score
```

This is the main final analytical output.

### 20.2 PCA Loadings

```text
data/final/gc_cpri_pca_loadings.csv
```

Contains the PCA loadings for each input variable and each principal component.

This file supports interpretation of which indicators drive PC1 and other components.

### 20.3 Explained Variance

```text
data/final/gc_cpri_explained_variance.csv
```

Contains the explained variance ratio and cumulative variance for each principal component.

This file supports model review and documentation.

---

## 21. Notebook 03: Final Outputs

Notebook:

```text
notebooks/03_final_outputs.ipynb
```

### 21.1 Purpose

This notebook prepares the final data files used by the interactive web application.

It loads:

```text
data/final/gc_cpri_scored_counties.csv
```

Then it creates county rankings, displays score summary statistics, and exports web-ready files.

---

## 22. Web App Output Files

The web tool uses files stored in:

```text
docs/data/
```

Current app-ready outputs include:

```text
docs/data/gc_cpri_scores_for_app.csv
docs/data/gc_cpri_scores_for_app.json
docs/data/gc_cpri_app_data_v2.json, if retained by app version
```

### 22.1 Simple CSV Output

```text
docs/data/gc_cpri_scores_for_app.csv
```

Contains:

```text
county
gc_cpri_score
```

This is a simple county-to-score file.

### 22.2 JSON Output

```text
docs/data/gc_cpri_scores_for_app.json
```

The notebook writes a JSON file for the app. In the current final cell, the file is written as a richer version 2 JSON payload that includes:

- Metadata for each indicator
- Indicator direction
- Indicator transformation method
- Display formatting information
- Means and standard deviations used for z-scoring
- Median values used for imputation
- PC1 loadings
- Raw score normalization parameters
- County-level raw indicator values
- County-level GC-CPRI scores

This allows the web app to recompute scores consistently when users adjust indicator weights.

---

## 23. Indicator Metadata in the Web App Export

Notebook 03 creates metadata for the seven PCA indicators.

| Indicator ID | Display Label | Direction | Transform | Display Format |
|---|---|---|---|---|
| `poverty_rate` | Poverty Rate | Higher is riskier | `div100` | Percent divided by 100 |
| `unemployment_rate` | Unemployment Rate | Higher is riskier | `div100` | Percent divided by 100 |
| `median_income` | Median Household Income | Lower is riskier | `negate` | Currency USD |
| `pct_less_hs` | Adults Without HS Diploma | Higher is riskier | `div100` | Percent divided by 100 |
| `non_white_share` | Non-White Voter Share | Higher is riskier | `none` | Percent share |
| `rural_urban_code` | Rural-Urban Code | Higher is riskier | `none` | Integer |
| `broadband_access_rate` | Limited Broadband Access | Lower access is riskier | `invert` | Percent share |

This metadata is important because it helps the web app display values in a user-friendly way and apply the same transformations used in the PCA notebook.

---

## 24. How the Web App Recomputes Scores

The web app export reproduces the same preprocessing used in Notebook 02:

1. Select the same seven PCA features.
2. Convert percent values when needed.
3. Negate median income.
4. Invert broadband access.
5. Median-impute missing values.
6. Compute feature means and population standard deviations.
7. Store PC1 loadings.
8. Store raw minimum and maximum score values for normalization.

This allows the app to adjust weights while preserving the original model context.

Important note: user-adjusted app scores are exploratory. They are useful for understanding trade-offs, but the official PCA score is the score produced by Notebook 02 using the PCA-derived PC1 loadings.

---

## 25. Current Model Assumptions

The current model is based on the following assumptions:

1. **County is the unit of analysis.**
   - All source data is merged to the Alabama county level.

2. **The index is relative.**
   - Scores compare counties against each other within the current dataset.

3. **Higher transformed values represent higher risk.**
   - Variables are directionally aligned before PCA.

4. **PC1 is used as the composite score.**
   - The first principal component is treated as the primary shared risk dimension.

5. **Median imputation is acceptable for missing values.**
   - Missing values are filled using feature medians.

6. **Standardization is required.**
   - All PCA inputs are standardized before PCA so variables with larger units do not dominate the model.

7. **The model is descriptive rather than causal.**
   - The index should not be interpreted as proving that any factor causes voter participation outcomes.

---

## 26. Important Methodological Notes

### 26.1 PCA Scores Can Change When Inputs Change

Because PCA is based on the structure of the input data, results may change if:

- New counties are added.
- Existing counties are removed.
- New indicators are added.
- Existing indicators are removed.
- Source data is updated.
- Missing values are handled differently.
- Feature transformations change.

### 26.2 Min-Max Normalization Is Relative

The 0 to 100 score depends on the minimum and maximum raw PC1 scores in the dataset.

This means:

- The county with the highest raw PC1 score receives 100.
- The county with the lowest raw PC1 score receives 0.
- Other counties are scaled between those two values.

The score is useful for comparison within the current model run, but it should not be interpreted as a fixed universal scale.

### 26.3 Indicator Direction Matters

PCA does not understand policy meaning by itself. Direction alignment must happen before PCA so the first component can be interpreted consistently as a risk score.

For example:

- Poverty does not need to be inverted because higher poverty is treated as higher risk.
- Median income is negated because lower income is treated as higher risk.
- Broadband access is inverted because lower access is treated as higher risk.

### 26.4 Loadings Need Interpretation

PCA loadings show statistical contribution, not moral or policy importance. A high loading means the variable contributes strongly to the shared pattern identified by PCA. It does not necessarily mean the variable is more important in every civic participation context.

---

## 27. Validation and Quality Checks

The workflow includes several built-in checks:

### 27.1 Source Data Checks

Notebook 01 prints dataset shapes and column names after loading source files. This helps confirm that expected data was loaded.

### 27.2 County Name Standardization

County names are standardized before merging. This reduces merge errors caused by inconsistent naming conventions.

### 27.3 Missing Value Review

Notebook 01 and Notebook 02 check missing values. Notebook 02 uses median imputation before PCA.

### 27.4 Summary Statistics

The notebooks use `.describe()` to inspect ranges, central tendencies, and potential outliers.

### 27.5 Correlation Matrix

Notebook 02 calculates a correlation matrix to review relationships among PCA variables.

### 27.6 Explained Variance Review

The explained variance table and scree plot help evaluate how much information PC1 captures.

### 27.7 Loadings Review

The loadings table and PC1 loadings chart help determine whether the PCA score is being driven by variables that make conceptual sense.

---

## 28. Recommended Additional Validation Before Final Client Use

Before treating outputs as final, the project team or client should review:

1. **County coverage**
   - Confirm all expected Alabama counties are included.

2. **Missing values**
   - Review any fields with missing values before and after imputation.

3. **Feature ranges**
   - Confirm percentages, shares, and dollar values are scaled correctly.

4. **Direction alignment**
   - Confirm that each indicator's transformation matches the intended risk interpretation.

5. **PC1 explained variance**
   - Confirm PC1 captures enough shared variation to support use as a composite index.

6. **PC1 loadings**
   - Confirm that loadings align with the project team's substantive understanding.

7. **County rankings**
   - Review high and low scoring counties for face validity.

8. **Web app outputs**
   - Confirm that web app scores match the final exported scores from Notebook 02.

---

## 29. Known Limitations

### 29.1 Descriptive, Not Causal

The GC-CPRI score identifies overlapping conditions associated with civic participation risk. It does not prove that any variable causes changes in voter participation or civic access.

### 29.2 Alabama-Specific Scope

The current workflow is designed for Alabama county-level data. Expanding to other states would require new source files, county standardization checks, and validation of indicator availability.

### 29.3 County-Level Aggregation

County-level scores can hide variation within counties. A county may contain communities with very different levels of access, infrastructure, or civic participation patterns.

### 29.4 PCA Interpretability

PCA is statistically useful, but it can be harder to explain than manually weighted scoring. The loadings chart and explained variance table should be used when presenting the model.

### 29.5 Normalized Scores Are Run-Specific

Because scores are normalized between the current minimum and maximum county scores, a score from one model run may not be directly comparable to a score from a later model run if inputs changed.

---

## 30. How to Rerun the Full Workflow

### Step 1: Install Dependencies

From the repository root, install the Python requirements:

```bash
pip install -r requirements.txt
```

### Step 2: Open Jupyter

```bash
jupyter notebook
```

or:

```bash
jupyter lab
```

### Step 3: Run Notebook 01

Run:

```text
notebooks/01_merge_and_feature_build.ipynb
```

Expected output:

```text
data/merged/gc_cpri_model_input.csv
```

### Step 4: Run Notebook 02

Run:

```text
notebooks/02_pca_analysis.ipynb
```

Expected outputs:

```text
data/final/gc_cpri_scored_counties.csv
data/final/gc_cpri_pca_loadings.csv
data/final/gc_cpri_explained_variance.csv
```

### Step 5: Run Notebook 03

Run:

```text
notebooks/03_final_outputs.ipynb
```

Expected outputs:

```text
docs/data/gc_cpri_scores_for_app.csv
docs/data/gc_cpri_scores_for_app.json
docs/data/gc_cpri_app_data_v2.json, if retained by app version
```

### Step 6: Check the Web App

After pushing updated files to GitHub, confirm that the GitHub Pages web app reflects the updated data.

Web app link:

```text
https://lacarabela.github.io/GC-CPRI/
```

---

## 31. Troubleshooting Guide

### Problem: File not found

Possible cause:

- The notebook is being run from the wrong working directory.
- The expected source file is missing or renamed.
- The folder structure does not match the expected repository structure.

Recommended fix:

- Confirm the notebook is inside the `notebooks/` folder.
- Confirm `Path.cwd().parent` points to the repository root.
- Confirm all files listed in this document exist in the expected folders.

### Problem: Missing expected column

Possible cause:

- The source file changed.
- A column was renamed during cleaning.
- The wrong data file was placed in the cleaned folder.

Recommended fix:

- Run the column inspection cells in Notebook 01.
- Compare printed column names against the selected fields.
- Update the feature selection code if the source file structure changed.

### Problem: PCA warning about missing values

Possible cause:

- One or more selected feature columns contain missing values.
- A feature column may be entirely missing.

Recommended fix:

- Review `pca_df.isna().sum()`.
- Confirm the source data is complete.
- If a column is entirely missing, do not rely on median imputation. Investigate the source file or remove the feature until corrected.

### Problem: Web app scores do not match notebook scores

Possible cause:

- Notebook 03 was not rerun after Notebook 02.
- Old files are still in `docs/data/`.
- The app is reading a different JSON file than expected.
- Browser cache is showing older data.

Recommended fix:

- Rerun all notebooks in order.
- Confirm `docs/data/` files have updated timestamps.
- Push the updated files to GitHub.
- Hard refresh the web app in the browser.

### Problem: Scores look reversed

Possible cause:

- PC1 sign may have flipped.
- PCA component signs are mathematically arbitrary.

Recommended fix:

- Review PC1 loadings.
- Confirm that high-scoring counties align with the intended risk interpretation.
- If the sign is reversed, multiply the raw PC1 score by `-1` before normalization and document the change.

Important note: PCA component signs can flip without changing the mathematical meaning of the component. The model should always be checked for interpretability after rerunning PCA.

---

## 32. Maintenance Notes for Future Updates

When updating the model, follow these rules:

1. **Always rerun notebooks in order.**
   - Notebook 01 creates the model input.
   - Notebook 02 creates the PCA scores.
   - Notebook 03 creates the web app files.

2. **Document any new data source.**
   - Add source notes.
   - Add data dictionary information.
   - Explain how the indicator is used.

3. **Document any new feature.**
   - Define the indicator.
   - Explain its source.
   - Explain its risk direction.
   - Explain any transformation.
   - State whether it is included in PCA.

4. **Review loadings after every feature change.**
   - Adding or removing indicators can change the PCA structure.

5. **Do not compare normalized scores across different model versions without context.**
   - Changes in data or features can change the 0 to 100 scale.

6. **Update the web app files after model changes.**
   - The app depends on exported files from Notebook 03.

7. **Keep requirements.txt current.**
   - If a new package is imported in any notebook, add it to `requirements.txt` unless it is part of the Python standard library.

---

## 33. Suggested Future Improvements

The current PCA workflow is functional, but the following improvements would make the project stronger for long-term use:

### 33.1 Add a Data Dictionary

Create a formal data dictionary that lists:

- Field name
- Plain-language definition
- Source file
- Year or time period
- Transformation
- Whether it is included in PCA
- Risk direction

### 33.2 Add Automated Validation Checks

Potential validation checks include:

- Confirm expected counties are present.
- Confirm no duplicate counties exist.
- Confirm percentage fields are within expected ranges.
- Confirm score fields are between 0 and 100.
- Confirm all app files are created successfully.

### 33.3 Save Model Metadata

Consider exporting a metadata file that records:

- Date model was run
- Input features
- Transformations
- Imputation method
- Scaling method
- PCA explained variance
- Score normalization minimum and maximum

### 33.4 Consider Versioning Outputs

For future updates, consider saving timestamped versions of output files. This would make it easier to compare model versions over time.

---

## 34. Client Interpretation Guide

When explaining the GC-CPRI score to non-technical audiences, use the following framing:

The GC-CPRI score is a relative county-level index that summarizes overlapping conditions related to civic participation risk. Higher scores indicate counties where selected socioeconomic, demographic, geographic, and infrastructure-related indicators overlap more strongly in the direction defined as risk. The score is not a causal finding and should be interpreted as a screening and comparison tool rather than a definitive measure of individual voter behavior.

Recommended language:

```text
A higher GC-CPRI score means that a county has a stronger overlap of conditions identified in the model as related to civic participation risk. The score is relative to the counties included in the current analysis and should be used to support further investigation, not as a standalone conclusion.
```

Avoid saying:

```text
This score proves that a county has poor civic participation.
```

Use instead:

```text
This score identifies counties where multiple risk-related conditions overlap and may warrant closer review.
```

---

## 35. Summary of Key Outputs

| Output | Location | Created By | Purpose |
|---|---|---|---|
| `gc_cpri_model_input.csv` | `data/merged/` | Notebook 01 | Final merged modeling dataset |
| `gc_cpri_scored_counties.csv` | `data/final/` | Notebook 02 | County-level scores and source fields |
| `gc_cpri_pca_loadings.csv` | `data/final/` | Notebook 02 | PCA loadings for interpretation |
| `gc_cpri_explained_variance.csv` | `data/final/` | Notebook 02 | PCA explained variance diagnostics |
| `gc_cpri_scores_for_app.csv` | `docs/data/` | Notebook 03 | Simple app-ready score file |
| `gc_cpri_scores_for_app.json` | `docs/data/` | Notebook 03 | Web app data payload with scores and metadata |

---

## 36. Final Handoff Notes

This PCA workflow is designed to be transparent and reproducible. The most important handoff principle is that the notebooks should always be treated as a sequence. Notebook 01 prepares the data, Notebook 02 builds the PCA score, and Notebook 03 prepares the results for the interactive web tool.

The final GC-CPRI score should be interpreted as a relative, descriptive index. It is useful for identifying counties where multiple risk-related conditions overlap, but it should be paired with local knowledge, legal expertise, policy context, and additional qualitative review before drawing broader conclusions.
