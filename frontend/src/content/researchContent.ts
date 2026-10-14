export const researchIntro =
  "We study whether image preparation and transfer learning can help DenseNet-201 distinguish Normal, Viral Pneumonia and Bacterial Pneumonia in pediatric chest X-rays. We document each comparison, keep the development split fixed and report what the results can—and cannot—establish.";

export const datasetSummary =
  "Our study uses the public Kermany pediatric chest X-ray dataset, with a public distribution on Kaggle. Our audit identified 5,856 readable images in the intended dataset folders; removing 32 redundant exact duplicates left 5,824 unique images.";

export const demoBoundary =
  "The interactive demo uses the frozen FT-004 research system: three original seed-42 DenseNet-201 models average their Normal, Viral and Bacterial probabilities. These scores are model outputs, not clinical diagnoses. The reported study scores are validation results; independent external pediatric evaluation remains outstanding.";

export const finalDecisionSummary =
  "FT-011 completed on 13 October 2026. It failed four of five screening checks, so we retained FT-004 and closed this tuning phase. The next research step is independent evaluation of the frozen system.";

export const matchedSeedScores = [
  { id: "FT-004", score: 86.953, detail: "Selected three-model ensemble", selected: true },
  { id: "FT-010", score: 85.631, detail: "Single-model control", selected: false },
  { id: "FT-011", score: 82.028, detail: "Final candidate · not selected", selected: false },
];

export const finalScreeningGates = [
  { label: "Macro F1", observed: 82.028, required: 86.131, passed: false },
  { label: "Balanced accuracy", observed: 81.731, required: 85.075, passed: false },
  { label: "Viral recall", observed: 58.296, required: 66.816, passed: false },
  { label: "Normal recall", observed: 98.734, required: 98.312, passed: true },
  { label: "Bacterial recall", observed: 88.164, required: 90.097, passed: false },
];

export const researchStats = [
  { value: "5,824", label: "Unique images after audit" },
  { value: "4,076", label: "Training images" },
  { value: "874", label: "Validation images" },
  { value: "874", label: "Test images" },
];

export const researchSteps = [
  {
    number: "01",
    title: "Start with public X-rays",
    body: "We use a public collection of pediatric chest X-rays described by Kermany and colleagues. A public copy of this dataset is available on Kaggle.",
    detail: "The dataset provides the source images and annotations. The original study and our own preparation audit are linked separately.",
    sourceIds: [1, 2, 3],
  },
  {
    number: "02",
    title: "Audit and filter the files",
    body: "We exclude extra copies and files outside the intended image layout. We then remove 32 redundant, byte-identical images, retaining 5,824 unique images.",
    detail: "The audit checked file readability and exact duplicates. Sixteen visually similar candidate pairs were reviewed and found to be distinct; none was removed as a confirmed near duplicate.",
    sourceIds: [3],
  },
  {
    number: "03",
    title: "Keep labels and fix the split",
    body: "We retain the dataset's Normal, Viral and Bacterial labels, then assign images to fixed training, validation and test groups. Related filename groups and exact duplicates stay together.",
    detail: "Labels come from source folders and filename markers, not our interpretation of the pixels. The split contains 4,076 training, 874 validation and 874 test images. No exact-duplicate or derived-group overlap was detected; authoritative patient IDs were unavailable.",
    sourceIds: [3],
  },
  {
    number: "04",
    title: "Prepare the images consistently",
    body: "We test color mapping and contrast adjustments, then resize and normalize the images for 224 × 224 model inputs. Enhancement changes the representation; it adds no new medical information.",
    detail: "The main pipeline is VIRIDIS color mapping → Global Histogram Equalization (overall contrast) → CLAHE (local contrast). GE and CLAHE return grayscale replicated across RGB channels, so the final input is not colorful. The ensemble adds two simpler streams. Random flips and small rotations apply during training only.",
    sourceIds: [3, 4, 14],
  },
  {
    number: "05",
    title: "Train and compare fairly",
    body: "We adapt pretrained DenseNet-201 models to the three labels. We compare alternatives on the same validation images and repeat confirmed finalists with three random seeds.",
    detail: "Macro F1 is our main score: it gives each class equal importance while balancing missed cases and incorrect predictions. We also examine class recall, balanced accuracy, variability and uncertainty. Repeating training does not provide new patients.",
    sourceIds: [4, 5, 6],
  },
  {
    number: "06",
    title: "Select, freeze and evaluate",
    body: "FT-011 completed the final comparison and failed four of five screening checks. We retained the frozen FT-004 ensemble and closed this tuning phase. The demo now uses its three-class prediction flow.",
    detail: "Each prediction uses the three original seed-42 models, one per preparation stream, with equal probability averaging. Confirmation at three seeds measured repeatability; it did not create a nine-network deployment. Independent pediatric evaluation is the next research phase.",
    sourceIds: [4, 8, 9, 10, 11, 12, 13, 14],
  },
];

export const researchModels = [
  {
    id: "FT-004",
    title: "Preprocessing ensemble",
    networks: "Three DenseNet-201 models",
    f1: "85.305% · three-seed mean",
    status: "Selected · frozen FT-004",
    sourceIds: [4, 14],
    description:
      "Three separately trained models examine differently prepared versions of the same X-ray. Their Normal, Viral and Bacterial scores are averaged equally. We deploy the original three seed-42 checkpoints. Its 0.276-point three-seed mean lead over FT-010 remains statistically uncertain on this validation cohort.",
  },
  {
    id: "FT-010",
    title: "Confirmed single-network alternative",
    networks: "One DenseNet-201 model",
    f1: "85.029% · three-seed mean",
    status: "Completed comparison",
    sourceIds: [4],
    description:
      "The strongest confirmed single-network alternative uses the main image pipeline and label smoothing of 0.05. It is the matched control for FT-011 and requires one network for each prediction.",
  },
  {
    id: "FT-011",
    title: "Final learning-rate experiment",
    networks: "One DenseNet-201 model",
    f1: "82.028% · seed 42 only",
    status: "Completed · not selected",
    sourceIds: [12, 13],
    description:
      "The smaller backbone learning rate did not pass the fixed screening checks. Only Normal recall passed; macro F1, balanced accuracy, Viral recall and Bacterial recall failed. Training selected epoch 5 and stopped at epoch 9. Seeds 123 and 2026 were not run, as required after a screening failure.",
  },
];

export const researchDocuments = [
  {
    title: "Dataset audit and research journal",
    description:
      "The preparation record documents file filtering, duplicates, label rules, fixed splits, baseline comparisons and the study's evidence boundaries.",
    status: "Foundational project record",
    url: "https://docs.google.com/document/d/1I9-egb-SZRzbGQ-PXxM8UjvGmc_CCcsZ/edit",
  },
  {
    title: "Fine-tuning and model-selection report",
    description:
      "Completed experiments FT-001 through FT-010, ROI screening, repeated runs, uncertainty estimates and the frozen FT-004 research ensemble.",
    status: "Completed experiment report",
    url: "https://docs.google.com/document/d/1mdLbxZMtv2icHKNs-VSjpZiWb5_2lG-S/edit",
  },
  {
    title: "FT-011 final report and decision",
    description:
      "Completed training history, exact screening gates, matched seed-42 comparisons and the terminal decision to retain FT-004. Includes the final graphs and numbered references.",
    status: "Completed 13 October 2026 · tuning closed",
    url: "https://github.com/Gerdoo2001/ai-research/blob/7a90abfa3695f61a17e4a2dd959c0da822080b21/model/docs/fine_tuning/FT011_Final_Report_20261013.md",
  },
  {
    title: "Frozen FT-004 model package",
    description:
      "The three original seed-42 checkpoints, verified file hashes, deterministic preparation streams and equal probability-averaging inference rule used by this demo.",
    status: "Selected research model · published package",
    url: "https://github.com/Gerdoo2001/ai-research/tree/7a90abfa3695f61a17e4a2dd959c0da822080b21/model/artifacts/ft004",
  },
];

export const researchSources = [
  {
    id: 1,
    title: "Chest X-Ray Images (Pneumonia)",
    authors: "Paul Mooney · Kaggle dataset distribution",
    year: "Public dataset",
    url: "https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia",
    takeaway: "A public distribution of the Kermany pediatric chest X-ray dataset. The project audit, rather than the distribution page, supplies our retained image counts.",
  },
  {
    id: 2,
    title: "Identifying Medical Diagnoses and Treatable Diseases by Image-Based Deep Learning",
    authors: "Kermany DS, Goldbaum M, Cai W, et al. · Cell 172(5):1122–1131.e9 · DOI: 10.1016/j.cell.2018.02.010",
    year: "2018",
    url: "https://pubmed.ncbi.nlm.nih.gov/29474911/",
    takeaway: "Original dataset and task provenance. Its results do not establish the performance of our own models.",
  },
  {
    id: 3,
    title: "Full research journal and dataset preparation audit",
    authors: "Project research record",
    year: "2026",
    url: "https://docs.google.com/document/d/1I9-egb-SZRzbGQ-PXxM8UjvGmc_CCcsZ/edit",
    takeaway: "Evidence for our file audit, 32 exact-duplicate exclusions, label rules, 5,824 retained images and the fixed group-aware split. Filename-derived groups do not establish complete patient separation.",
  },
  {
    id: 4,
    title: "DenseNet-201 fine-tuning and ROI experiment record",
    authors: "Project research record · FT-001 through FT-010 and final FT-004 selection",
    year: "2026",
    url: "https://docs.google.com/document/d/1mdLbxZMtv2icHKNs-VSjpZiWb5_2lG-S/edit",
    takeaway: "Evidence for completed experiments, three-seed means, ensemble construction and validation uncertainty. Earlier test results from another configuration do not transfer to FT-004 or FT-011.",
  },
  {
    id: 5,
    title: "FT-011 final tuning protocol and selection rationale",
    authors: "Project research record",
    year: "2026 · historical protocol",
    url: "https://docs.google.com/document/d/15m0nbeDkg9mOR14nv6e6ugqWiczRaeiC5C2ijUdpRz0/edit",
    takeaway: "Why one final learning-rate comparison was planned, with fixed selection rules. Read the completed final report and terminal status for the actual outcome; this earlier document records the plan.",
  },
  {
    id: 6,
    title: "How transferable are features in deep neural networks?",
    authors: "Yosinski J, Clune J, Bengio Y, Lipson H · NeurIPS 27:3320–3328",
    year: "2014",
    url: "https://arxiv.org/abs/1411.1792",
    takeaway: "Learned visual patterns differ in how well they transfer across tasks. This motivates adapting pretrained features carefully; it does not prove the FT-011 rates will improve X-ray classification.",
  },
  {
    id: 7,
    title: "Learning Transferable Features with Deep Adaptation Networks",
    authors: "Long M, Cao Y, Wang J, Jordan MI · ICML, PMLR 37:97–105 · §4.1",
    year: "2015",
    url: "https://proceedings.mlr.press/v37/long15.html",
    takeaway: "Uses a classifier learning rate ten times that of pretrained lower layers. This is a precedent for our rate ratio, with a different architecture, dataset and layer-freezing policy.",
  },
  {
    id: 8,
    title: "On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation",
    authors: "Cawley GC, Talbot NLC · JMLR 11(70):2079–2107",
    year: "2010",
    url: "https://www.jmlr.org/papers/v11/cawley10a.html",
    takeaway: "Repeated model selection on the same data can produce optimistic estimates. It supports bounding further tuning, but does not prescribe FT-011 as the last experiment.",
  },
  {
    id: 9,
    title: "TRIPOD+AI statement: updated guidance for reporting clinical prediction models",
    authors: "Collins GS, Moons KGM, Dhiman P, et al. · BMJ 385:e078378 · DOI: 10.1136/bmj-2023-078378",
    year: "2024",
    url: "https://www.bmj.com/content/385/bmj-2023-078378",
    takeaway: "Guides transparent reporting of data, methods, results and limitations, and distinguishes evaluation data from tuning data. It is reporting guidance, not proof of clinical validity.",
  },
  {
    id: 10,
    title: "Simple and Scalable Predictive Uncertainty Estimation using Deep Ensembles",
    authors: "Lakshminarayanan B, Pritzel A, Blundell C · NeurIPS 30",
    year: "2017",
    url: "https://arxiv.org/abs/1612.01474",
    takeaway: "Supports averaging probabilities from separately trained networks. It does not validate our exact preprocessing streams or establish calibration of FT-004.",
  },
  {
    id: 11,
    title: "Evaluation of clinical prediction models (part 2): how to undertake an external validation study",
    authors: "Riley RD, Archer L, Snell KIE, et al. · BMJ 384:e074820 · DOI: 10.1136/bmj-2023-074820",
    year: "2024",
    url: "https://www.bmj.com/content/384/bmj-2023-074820",
    takeaway: "Supports applying the frozen model to suitable independent data, with reliable labels and uncertainty estimates. Independent evaluation remains the next research phase.",
  },
  {
    id: 12,
    title: "Current status: FT-011 complete, retain FT-004",
    authors: "Project research record · ai-research · pinned publication 7a90abf",
    year: "13 October 2026",
    url: "https://github.com/Gerdoo2001/ai-research/blob/7a90abfa3695f61a17e4a2dd959c0da822080b21/model/docs/CURRENT_STATUS.md",
    takeaway: "Establishes the terminal status: FT-011 failed four of five seed-42 gates, confirmation seeds were not run, FT-004 was retained and this tuning phase is closed. Independent evaluation remains outstanding.",
  },
  {
    id: 13,
    title: "FT-011 Final Controlled Experiment and Selected Model",
    authors: "Project research report · ai-research · pinned publication 7a90abf",
    year: "13 October 2026",
    url: "https://github.com/Gerdoo2001/ai-research/blob/7a90abfa3695f61a17e4a2dd959c0da822080b21/model/docs/fine_tuning/FT011_Final_Report_20261013.md",
    takeaway: "Supplies the completed training history, full-precision decision thresholds, matched seed-42 validation scores and comparison uncertainty. It distinguishes single-seed results from three-seed means and reports the retained three-model system.",
  },
  {
    id: 14,
    title: "Frozen FT-004 research model: publication and inference package",
    authors: "Project model package · ai-research · original frozen seed-42 checkpoints",
    year: "Published 14 October 2026",
    url: "https://github.com/Gerdoo2001/ai-research/blob/7a90abfa3695f61a17e4a2dd959c0da822080b21/model/artifacts/ft004/README.md",
    takeaway: "Specifies the three preparation streams, class order, verified checkpoints and equal probability averaging used by this demo. The original weights are preserved; package publication does not establish clinical readiness or external performance.",
  },
];
