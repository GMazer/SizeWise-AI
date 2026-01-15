import React from 'react';

export interface BodyMeasurements {
  height: string; // cm
  weight: string; // kg
  bust: string;   // cm (Optional in basic mode)
  waist: string;  // cm (Optional in basic mode)
  hips: string;   // cm (Optional in basic mode)
}

export interface SizePrediction {
  suggestedSize: string;
  confidence: number;
  explanation: string;
  advice: string;
  // Fields for Basic Model logic (ambiguous cases)
  alternativeSize?: string;
  isAmbiguous?: boolean;
}

export interface InputFieldProps {
  id: keyof BodyMeasurements;
  label: string;
  value: string;
  unit: string;
  placeholder: string;
  icon?: React.ReactNode;
  onChange: (id: keyof BodyMeasurements, value: string) => void;
}