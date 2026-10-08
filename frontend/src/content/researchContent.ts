export const researchIntro =
  "We study whether image preparation and transfer learning can help DenseNet-201 distinguish Normal, Viral Pneumonia and Bacterial Pneumonia in pediatric chest X-rays. We document each comparison, keep the development split fixed and report what the results can—and cannot—establish.";

export const datasetSummary =
  "Our study uses the public Kermany pediatric chest X-ray dataset, with a public distribution on Kaggle. Our audit identified 5,856 readable images in the intended dataset folders; removing 32 redundant exact duplicates left 5,824 unique images.";

export const demoBoundary =
  "The interactive demo currently predicts Normal or Pneumonia using one binary model. The three-class FT-004, FT-010 and FT-011 results below belong to the documented research study. They are not performance measurements of the demo. Independent external pediatric evaluation of the selected research system remains outstanding.";

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
    detail: "The main pipeline is VIRIDIS color mapping → Global Histogram Equalization (overall contrast) → CLAHE (local contrast). The selected ensemble also uses two simpler preparation streams. Random flips and small rotations are used during training only.",
    sourceIds: [3, 4],
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
    body: "FT-004 is the current selected research ensemble: three models' scores are averaged into one prediction. FT-011 is undergoing the final tuning experiment; its results are pending.",
    detail: "FT-011 keeps FT-010's single-network setup and lowers only the backbone's initial learning rate. After the fixed selection rules are applied, we freeze the chosen system and move to evaluation on suitable independent pediatric data.",
    sourceIds: [4, 5, 7, 8, 9, 10, 11],
  },
];

export const researchModels = [
  {
    id: "FT-004",
    title: "Preprocessing ensemble",
    networks: "Three DenseNet-201 models",
    f1: "85.305% · three-seed mean",
    status: "Current research selection",
    description:
      "Three separately trained models examine differently prepared versions of the same X-ray. Their Normal, Viral and Bacterial probability scores are averaged equally. Its 0.276-point mean lead over FT-010 remains statistically uncertain on this validation cohort.",
  },
  {
    id: "FT-010",
    title: "Confirmed single-network alternative",
    networks: "One DenseNet-201 model",
    f1: "85.029% · three-seed mean",
    status: "Completed comparison",
    description:
      "The strongest confirmed single-network alternative uses the main image pipeline and label smoothing of 0.05. It is the matched control for FT-011 and requires one network for each prediction.",
  },
  {
    id: "FT-011",
    title: "Final learning-rate experiment",
    networks: "One DenseNet-201 model",
    f1: "Pending",
    status: "Training in progress",
    description:
      "We retain FT-010's setup and use a smaller initial learning rate for the pretrained backbone: 0.00001 rather than 0.0001. The classifier stays at 0.0001. All layers remain trainable; selection waits for the fixed screening and confirmation rules.",
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
    title: "FT-011 final tuning record",
    description:
      "Why we chose one final experiment, the learning-rate change, fixed decision rules and a citation matrix explaining each source's contribution.",
    status: "Training in progress · results pending",
    url: "https://docs.google.com/document/d/15m0nbeDkg9mOR14nv6e6ugqWiczRaeiC5C2ijUdpRz0/edit",
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
    title: "FT-011 Final Tuning Experiment Record and Selection Rationale",
    authors: "Project research record",
    year: "Training in progress",
    url: "https://docs.google.com/document/d/15m0nbeDkg9mOR14nv6e6ugqWiczRaeiC5C2ijUdpRz0/edit",
    takeaway: "Our final experiment's settings and selection rules. Exact rates, margins and the stopping point are project choices; no FT-011 performance result is reported yet.",
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
];
