from typing import Literal

from pydantic import BaseModel, Field, model_validator

ClassName = Literal["NORMAL", "VIRAL", "BACTERIAL"]


class ClassProbabilities(BaseModel):
    NORMAL: float = Field(ge=0, le=1)
    VIRAL: float = Field(ge=0, le=1)
    BACTERIAL: float = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    model: Literal["FT-004"]
    model_version: str = Field(pattern=r"^[0-9a-f]{40}$")
    label: ClassName
    probabilities: ClassProbabilities
    class_order: tuple[Literal["NORMAL"], Literal["VIRAL"], Literal["BACTERIAL"]]
    member_count: Literal[3]

    @model_validator(mode="after")
    def check_prediction(self):
        scores = self.probabilities.model_dump()
        if abs(sum(scores.values()) - 1) > 1e-5:
            raise ValueError("Class probabilities must sum to one")
        if max(self.class_order, key=scores.__getitem__) != self.label:
            raise ValueError("Predicted label must match the highest averaged class score")
        return self
