export type ResearchVisualItem = {
  label: string;
  value: string;
  detail: string;
};

export type ResearchSlide = {
  chapter: string;
  title: string;
  lead: string;
  points: string[];
  takeaway: string;
  sources: number[];
  visual: "tiles" | "flow" | "split" | "ensemble" | "scores" | "rates" | "gate" | "lungs" | "imagery" | "distribution" | "uncertainty" | "decision";
  visualTitle: string;
  items: ResearchVisualItem[];
  visualNote?: string;
};

export const researchSlides: ResearchSlide[] = [
  {
    chapter: "The question",
    title: "What are we trying to learn?",
    lead: "Can a model distinguish three categories of pediatric chest X-rays, and which preparation and training choices help it do so?",
    points: [
      "We study Normal, Viral Pneumonia and Bacterial Pneumonia.",
      "We compare several model and image-preparation choices using the same development data.",
      "The aim is a documented research classifier. Independent evaluation is still needed before broader claims.",
    ],
    takeaway: "Our study is a sequence of controlled comparisons, with evidence for each decision.",
    sources: [2, 3, 4],
    visual: "lungs",
    visualTitle: "Explore the anatomy behind the study",
    items: [
      { label: "01", value: "Prepare the data", detail: "Audit, labels and fixed splits" },
      { label: "02", value: "Compare the models", detail: "Image preparation, training and confirmation" },
      { label: "03", value: "Freeze and evaluate", detail: "Final tuning, selection and independent data" },
    ],
  },
  {
    chapter: "The data",
    title: "We begin with public X-rays",
    lead: "The study uses the Kermany pediatric chest X-ray dataset. A public distribution is available on Kaggle.",
    points: [
      "The source provides chest X-ray images and their annotations.",
      "Our audit counts the intended image files before deciding what enters the study.",
      "Our retained counts come from the project audit, rather than the public dataset page.",
    ],
    takeaway: "Public data is the starting point; the audited study dataset is the version we actually use.",
    sources: [1, 2, 3],
    visual: "imagery",
    visualTitle: "What a chest radiograph looks like",
    items: [
      { label: "Source", value: "Kermany dataset", detail: "Pediatric chest radiographs" },
      { label: "Public distribution", value: "Kaggle", detail: "Chest X-Ray Images (Pneumonia)" },
      { label: "Before exact deduplication", value: "5,856", detail: "Readable images in the intended layout" },
      { label: "Retained dataset", value: "5,824", detail: "Unique images after the audit" },
    ],
  },
  {
    chapter: "The data",
    title: "We check and filter the files",
    lead: "We remove redundant files so extra copies do not count as extra examples.",
    points: [
      "Exclude metadata, verified nested copies and files outside the intended dataset layout.",
      "Compare exact file content and remove 32 redundant, byte-identical images.",
      "Review 16 visually similar candidate pairs. All were distinct, so none was removed as a confirmed near duplicate.",
    ],
    takeaway: "5,856 − 32 = 5,824 unique images for the study.",
    sources: [3],
    visual: "flow",
    visualTitle: "What the filtering actually did",
    items: [
      { label: "Check the intended files", value: "5,856 readable images", detail: "Extra source copies and non-image files excluded" },
      { label: "Remove exact repetitions", value: "32 redundant images", detail: "SHA-256 / byte-identity comparison" },
      { label: "Review similar images", value: "16 candidate pairs", detail: "Manual review found distinct images" },
      { label: "Keep the study dataset", value: "5,824 unique images", detail: "No unreadable image retained" },
    ],
  },
  {
    chapter: "The data",
    title: "We keep the source labels",
    lead: "Each image keeps its dataset label. We do not create a new diagnosis by looking at the image ourselves.",
    points: [
      "NORMAL folders identify the Normal class.",
      "The pneumonia filenames contain virus or bacteria markers for the two pneumonia classes.",
      "The class sizes differ, so a score that gives each class equal importance is useful.",
    ],
    takeaway: "These are dataset annotations, rather than new clinical adjudications.",
    sources: [3],
    visual: "distribution",
    visualTitle: "Class balance in the audited dataset",
    items: [
      { label: "Normal", value: "1,579", detail: "Images from the NORMAL source folders" },
      { label: "Viral Pneumonia", value: "1,485", detail: "Pneumonia images with virus filename markers" },
      { label: "Bacterial Pneumonia", value: "2,760", detail: "Pneumonia images with bacteria filename markers" },
    ],
  },
  {
    chapter: "The data",
    title: "We assign fixed roles to the images",
    lead: "Training teaches the model. Validation compares our choices. A test set is a separate assignment for evaluation.",
    points: [
      "We rebuild the original folder split because related filename groups crossed those folders.",
      "Exact-content groups and related filename groups are kept together in the fixed assignments.",
      "No exact-hash or derived-group overlap was detected. Complete patient separation cannot be established without authoritative patient IDs.",
    ],
    takeaway: "Every candidate uses the same split, so differences are easier to interpret.",
    sources: [3, 4],
    visual: "split",
    visualTitle: "5,824 images, three fixed roles",
    items: [
      { label: "Training", value: "4,076", detail: "Learn the model parameters · approximately 70%" },
      { label: "Validation", value: "874", detail: "Choose and compare configurations · approximately 15%" },
      { label: "Test", value: "874", detail: "Separate evaluation assignment · approximately 15%" },
    ],
    visualNote: "An earlier GE-only model has historical test results. Those results do not establish the performance of the newer selected configurations.",
  },
  {
    chapter: "Image preparation",
    title: "We test how to present each X-ray",
    lead: "Image preparation changes the representation seen by the model. It does not add medical information to the original X-ray.",
    points: [
      "VIRIDIS maps grayscale values to artificial colors.",
      "Global Histogram Equalization (GE) adjusts overall contrast; CLAHE adjusts contrast locally.",
      "GE and CLAHE return grayscale replicated across RGB channels: the final input does not retain a colorful VIRIDIS palette. We fit/crop and normalize to 224 × 224; rotations and flips apply during training only.",
    ],
    takeaway: "The main selected preparation order is VIRIDIS → GE → CLAHE.",
    sources: [3, 4, 14],
    visual: "flow",
    visualTitle: "The main image-preparation path",
    items: [
      { label: "Starting image", value: "Chest X-ray", detail: "Use the full image" },
      { label: "Color representation", value: "VIRIDIS", detail: "Artificial color mapping" },
      { label: "Contrast", value: "GE → CLAHE", detail: "Overall contrast, then local contrast" },
      { label: "Model input", value: "224 × 224", detail: "Consistent resize/crop and normalization" },
    ],
    visualNote: "This diagram describes operations; it is not an example of a patient's image.",
  },
  {
    chapter: "Model selection",
    title: "We compare architectures and image orders",
    lead: "We first compare eight pretrained classifiers, then investigate the image-preparation choices more closely.",
    points: [
      "DenseNet-201 and ResNet-50 receive the baseline plus every ordered subset of the three preparation operations: 16 conditions per model.",
      "The strongest candidates are repeated at seeds 42, 123 and 2026.",
      "DenseNet-201 leads the initial three-seed ranking, but its 0.026-point gap over DenseNet-169 is very small.",
    ],
    takeaway: "DenseNet-201 with VIRIDIS → GE → CLAHE becomes the reference for later fine-tuning.",
    sources: [3],
    visual: "scores",
    visualTitle: "Initial phase · validation macro F1",
    items: [
      { label: "DenseNet-201", value: "84.168%", detail: "VIRIDIS → GE → CLAHE" },
      { label: "DenseNet-169", value: "84.142%", detail: "VIRIDIS → GE → CLAHE" },
      { label: "ResNet-50", value: "83.472%", detail: "CLAHE → VIRIDIS → GE" },
    ],
    visualNote: "All values are three-seed means from the initial comparison, before the FT-004 ensemble phase.",
  },
  {
    chapter: "Training",
    title: "We adapt an already trained network",
    lead: "Transfer learning starts with learned visual features and adapts them to our three X-ray categories.",
    points: [
      "The backbone extracts visual patterns. The classifier turns those patterns into three class scores.",
      "For the DenseNet-201 reference, an epoch is one pass through the training images; training has a ceiling of 12 epochs and can stop earlier.",
      "Macro F1 gives each class equal importance. Recall checks how many images of a class are correctly found. Repeated seeds check sensitivity to training randomness.",
    ],
    takeaway: "Three training seeds are repeatability checks; they do not supply new patients or new cohorts.",
    sources: [3, 4, 6],
    visual: "flow",
    visualTitle: "How one model produces a prediction",
    items: [
      { label: "Input", value: "Prepared X-ray", detail: "224 × 224 pixels" },
      { label: "Backbone", value: "DenseNet-201 features", detail: "Adapt pretrained visual patterns" },
      { label: "Classifier", value: "Three probabilities", detail: "Normal · Viral · Bacterial" },
      { label: "Prediction", value: "Highest probability", detail: "Compare against the source label in evaluation" },
    ],
  },
  {
    chapter: "Fine-tuning",
    title: "We test several possible improvements",
    lead: "A plausible idea still has to pass our project's checks. Some ideas improved one class while hurting the overall result.",
    points: [
      "Larger inputs (FT-001) and extra spatial augmentation (FT-003) reduced macro F1.",
      "The tested lung-ROI approaches (FT-002, FT-005, FT-008) had feasibility or mask-quality failures; they are not part of the selected classifier.",
      "Focal loss (FT-006) and a two-stage hierarchy (FT-009B) improved Viral recall but failed the advancement tradeoff. Label smoothing (FT-007, confirmed in FT-010) remained a useful simpler candidate.",
    ],
    takeaway: "The project records negative results and class tradeoffs, as well as improvements.",
    sources: [4, 5],
    visual: "tiles",
    visualTitle: "What the completed experiments taught us",
    items: [
      { label: "Resolution & augmentation", value: "Did not improve", detail: "FT-001 and FT-003" },
      { label: "Lung cropping / masks", value: "Did not advance", detail: "FT-002, FT-005 and FT-008" },
      { label: "Focal loss / hierarchy", value: "Class tradeoffs", detail: "FT-006 and FT-009B" },
      { label: "Ensemble / smoothing", value: "Confirmed finalists", detail: "FT-004 and FT-010" },
    ],
  },
  {
    chapter: "FT-004",
    title: "FT-004 asks three models for an answer",
    lead: "The same X-ray is prepared three different ways. Each version goes to a separately trained DenseNet-201 model.",
    points: [
      "Each model returns probabilities for Normal, Viral and Bacterial.",
      "We average the three probability vectors equally, then choose the class with the largest average.",
      "The demo uses the three original seed-42 checkpoints. The three confirmation seeds measured training repeatability; each prediction still uses three networks.",
    ],
    takeaway: "FT-004 is one ensemble system containing three separately trained models.",
    sources: [4, 10, 14],
    visual: "ensemble",
    visualTitle: "One image → three views → one prediction",
    items: [
      { label: "Model 1", value: "VIRIDIS → GE → CLAHE", detail: "Normal · Viral · Bacterial scores" },
      { label: "Model 2", value: "VIRIDIS → GE", detail: "Normal · Viral · Bacterial scores" },
      { label: "Model 3", value: "GE only", detail: "Normal · Viral · Bacterial scores" },
    ],
    visualNote: "Equal probability averaging: (model 1 + model 2 + model 3) ÷ 3.",
  },
  {
    chapter: "FT-010",
    title: "FT-010 uses one model",
    lead: "FT-010 confirms the label-smoothed single-network configuration across the same three training seeds.",
    points: [
      "One X-ray follows the main VIRIDIS → GE → CLAHE preparation path.",
      "One DenseNet-201 returns the three class probabilities, then the largest score determines the class.",
      "Label smoothing of 0.05 makes training targets slightly less absolute. It is a training setting and does not add another inference model.",
    ],
    takeaway: "FT-010 is the strongest confirmed single-network alternative and the matched control for FT-011.",
    sources: [4, 5],
    visual: "flow",
    visualTitle: "The simpler prediction path",
    items: [
      { label: "Input", value: "One X-ray", detail: "Same image source and fixed assignments" },
      { label: "Preparation", value: "VIRIDIS → GE → CLAHE", detail: "224 × 224 input" },
      { label: "Model", value: "One DenseNet-201", detail: "Trained with label smoothing 0.05" },
      { label: "Output", value: "One prediction", detail: "Highest Normal / Viral / Bacterial probability" },
    ],
  },
  {
    chapter: "The evidence",
    title: "FT-004 leads, but the gap is small",
    lead: "FT-004 has the highest three-seed mean macro F1 among confirmed finalists. FT-010 stays close while using fewer networks.",
    points: [
      "The FT-004 versus FT-010 mean difference is 0.276 percentage points.",
      "Its 95% paired-bootstrap interval runs from −0.833 to +1.369 points. Because it spans zero, superiority remains uncertain.",
      "FT-004 leads the fixed ranking rule. FT-010 remains a defensible simpler alternative; the interval does not prove the models are equivalent.",
    ],
    takeaway: "A higher observed score supports the ranking, without proving a clear advantage on new patients.",
    sources: [4, 5],
    visual: "uncertainty",
    visualTitle: "A small lead, with uncertainty",
    items: [
      { label: "FT-004 · three networks", value: "85.305%", detail: "Frozen research selection · three-seed mean" },
      { label: "FT-010 · one network", value: "85.029%", detail: "Confirmed simpler alternative" },
      { label: "Original single pipeline", value: "84.168%", detail: "Reference from the initial phase" },
    ],
  },
  {
    chapter: "FT-011",
    title: "FT-011 changes one learning-rate policy",
    lead: "We keep FT-010's setup and give the pretrained backbone a smaller initial learning rate. The classifier rate stays the same.",
    points: [
      "Backbone: 0.0001 → 0.00001. The learning-rate multiplier is ten times smaller; actual weight changes need not be exactly ten times smaller.",
      "Classifier: stays at 0.0001. The task-specific decision layers continue adapting at the control rate.",
      "All layers remain trainable. The data, main preparation path, label smoothing, training budget and one-network prediction flow stay matched.",
    ],
    takeaway: "We tested whether slower backbone adaptation would help. The completed comparison did not meet the fixed selection checks.",
    sources: [5, 6, 7, 13],
    visual: "rates",
    visualTitle: "Same network, different initial rates",
    items: [
      { label: "FT-010 · matched control", value: "0.0001", detail: "Backbone 0.0001 · classifier 0.0001" },
      { label: "FT-011 · completed candidate", value: "0.00001", detail: "Backbone 0.00001 · classifier 0.0001" },
    ],
    visualNote: "A 10:1 classifier-to-backbone rate ratio is a literature precedent, not proof of improvement in this study. Each run starts from matched pretrained initialization.",
  },
  {
    chapter: "The decision",
    title: "The final comparison retained FT-004",
    lead: "FT-011 completed on 13 October 2026. Its seed-42 result failed four of five checks fixed before training.",
    points: [
      "The candidate found Normal examples well, but macro F1, balanced accuracy, Viral recall and Bacterial recall missed their required floors.",
      "Any screening failure required stopping. We did not run confirmation seeds 123 and 2026 or claim a three-seed FT-011 mean.",
      "The chart compares the same seed and validation images. FT-004's 86.953% here differs from its 85.305% three-seed mean.",
    ],
    takeaway: "Retain FT-004. The fixed learning-rate candidate did not qualify, so this tuning phase is closed.",
    sources: [12, 13],
    visual: "decision",
    visualTitle: "Matched seed-42 validation comparison",
    items: [
      { label: "FT-004", value: "86.953%", detail: "Selected three-model ensemble" },
      { label: "FT-010", value: "85.631%", detail: "Matched single-model control" },
      { label: "FT-011", value: "82.028%", detail: "Final candidate · not selected" },
    ],
  },
  {
    chapter: "Why this is last",
    title: "We answered the last tuning question",
    lead: "The predeclared final experiment tested one learning-rate policy on the strongest confirmed one-network configuration.",
    points: [
      "The established image and prediction flow stayed matched, so the initial learning-rate policy was the intended change.",
      "The fixed candidate failed screening after one full seed-42 run. We closed tuning instead of starting another rate, loss, ROI or ensemble search.",
      "Repeatedly selecting on the same validation images can make results look too optimistic. Stopping bounds additional selection, but does not erase the earlier search.",
    ],
    takeaway: "“Last” means this planned tuning phase is complete. It does not establish global optimality or clinical readiness.",
    sources: [8, 9, 12, 13],
    visual: "tiles",
    visualTitle: "A bounded final comparison",
    items: [
      { label: "Question", value: "One remaining factor", detail: "Backbone / classifier learning-rate policy" },
      { label: "Candidate", value: "One fixed setup", detail: "FT-010 control, matched settings" },
      { label: "Actual outcome", value: "One candidate run", detail: "Best epoch 5 · early stop at epoch 9" },
      { label: "Terminal decision", value: "Tuning closed", detail: "FT-004 retained · no confirmation runs" },
    ],
  },
  {
    chapter: "What comes next",
    title: "The model is frozen; independent evaluation is next",
    lead: "FT-004 remains selected. The demo now runs the published three-model system; the next research step is evaluation on suitable independent pediatric data.",
    points: [
      "Retain the preprocessing, checkpoint, class order, prediction rule and versions so evaluation uses the same system.",
      "A three-class evaluation needs reliable Normal, Viral and Bacterial labels. A binary cohort cannot validate Viral/Bacterial discrimination.",
      "Report class performance, calibration and uncertainty on the independent cohort. The current study's validation scores are not external-test or clinical performance claims.",
    ],
    takeaway: "Current evidence supports development decisions. Independent external performance remains an open research question.",
    sources: [9, 11, 12, 14],
    visual: "flow",
    visualTitle: "From development to the next research phase",
    items: [
      { label: "Final comparison", value: "FT-011 complete", detail: "Four screening checks failed · tuning closed" },
      { label: "Selected system", value: "Frozen FT-004", detail: "Original three seed-42 checkpoints" },
      { label: "Demo", value: "Three-class ensemble inference", detail: "Equal probability averaging · same frozen setup" },
      { label: "Next phase", value: "Independent pediatric evaluation", detail: "Not completed for the selected research system" },
    ],
  },
];
