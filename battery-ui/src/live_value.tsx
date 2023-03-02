import React from 'react';
import './App.css';

interface TemperatureProps {
  temp: number;
}

function LiveValue({ temp }: TemperatureProps) {
  let valueColour: string;

  if (temp < 20) {
    valueColour = 'blue';
  } else if (temp > 80) {
    valueColour = 'red';
  } else {
    valueColour = 'green';
  }

  return (
    <header className="live-value" style={{ color: valueColour }}>
      {`${temp.toString()}°C`}
    </header>
  );
}

export default LiveValue;
