export type SourceLink = {
  label: string;
  url: string;
};

export type FactCard = {
  title: string;
  body: string;
  source: SourceLink;
};

export type WorkflowStep = {
  title: string;
  body: string;
  icon: string;
};

export const pneumoniaFacts: FactCard[] = [
  {
    title: "Pneumonia is a lung infection",
    body: "It can be caused by bacteria, viruses, or fungi and affects the lungs, where air sacs may fill with fluid or pus.",
    source: {
      label: "CDC",
      url: "https://www.cdc.gov/pneumonia/",
    },
  },
  {
    title: "Symptoms can vary by person",
    body: "Common warning signs include cough, fever, chills, and difficulty breathing, but severity can change with age, health, and infection type.",
    source: {
      label: "CDC",
      url: "https://www.cdc.gov/pneumococcal/signs-symptoms/index.html",
    },
  },
  {
    title: "Children may show fast breathing",
    body: "WHO notes that children under 5 with cough or difficult breathing may be assessed for fast breathing or lower chest wall indrawing.",
    source: {
      label: "WHO",
      url: "https://www.who.int/news-room/fact-sheets/detail/pneumonia",
    },
  },
  {
    title: "Prevention reduces risk",
    body: "Vaccination, hand hygiene, cleaner air, and timely care are important prevention and control measures for pneumonia.",
    source: {
      label: "CDC",
      url: "https://www.cdc.gov/pneumonia/prevention/",
    },
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Upload",
    body: "Choose one chest X-ray in JPEG or PNG format. Select Analyze to send it to the analysis service.",
    icon: "pi pi-upload",
  },
  {
    title: "Preprocess",
    body: "The service prepares the three image views recorded for FT-004, one for each trained DenseNet201 model.",
    icon: "pi pi-sliders-h",
  },
  {
    title: "Predict",
    body: "FT-004 averages the three models’ Normal, Viral Pneumonia and Bacterial Pneumonia scores equally, then selects the highest class score.",
    icon: "pi pi-chart-line",
  },
  {
    title: "Review",
    body: "Review the predicted pattern and all three model scores. The research result is not a diagnosis and needs clinical interpretation.",
    icon: "pi pi-check-circle",
  },
];
