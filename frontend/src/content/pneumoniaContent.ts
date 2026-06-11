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
    body: "The app accepts a chest X-ray image in JPEG or PNG format and sends it to the FastAPI backend.",
    icon: "pi pi-upload",
  },
  {
    title: "Preprocess",
    body: "The backend converts the image to RGB, applies CLAHE contrast enhancement, resizes it, and normalizes pixel values.",
    icon: "pi pi-sliders-h",
  },
  {
    title: "Predict",
    body: "The DenseNet201 binary classifier returns a pneumonia probability and a threshold-based label.",
    icon: "pi pi-chart-line",
  },
  {
    title: "Review",
    body: "The UI displays the result with confidence, status messaging, and a clear research-use safety note.",
    icon: "pi pi-check-circle",
  },
];
