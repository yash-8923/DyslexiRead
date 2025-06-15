"use client";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Refined() {
  const [refinedText, setRefinedText] = useState<string>("");
  const [defaultText, setDefaultText] = useState<string | null>("");
  const [summary, setSummary] = useState<string>("");
  const [rephrased, setRephrased] = useState<string>("");
  const [level, setLevel] = useState<string>("moderate");

  // This effect will be used to set the data passed from the previous page (e.g. from FileUploader)
  // This effect will be used to get the data from sessionStorage
  useEffect(() => {
    const savedText = sessionStorage.getItem("pdfText");
    setDefaultText(savedText);

    if (savedText && !refinedText) {
      setRefinedText(savedText); // Set the refined text if found in sessionStorage

      const fetchRefinedText = async () => {
        try {
          const res = await fetch("/api/ai-process", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputText: savedText,
              readingLevel: level || "default", // or dynamically choose later
            }),
          });
          console.log(`Text sent to AI with ${level}`);
          const data = await res.json();

          if (data.summary !== undefined) {
            setSummary(data.summary);
            console.log("Summary complete!");
          }
          if (data.rephrased !== undefined) {
            setRephrased(data.rephrased);
            console.log("Rephrase complete!");
          }
        } catch (error) {
          console.error("Error calling AI API:", error);
          setRefinedText("Error connecting to AI.");
        }
      };

      fetchRefinedText();
    } else {
      setRefinedText("No text found in session.");
    }
  }, [level]);

  // Handle Level change
  const handleLevelChange = (value: string) => {
    setLevel(value); // Set the selected Level value
  };

  const formattedRephrased = (rephrased || defaultText || "")
    .replace(/\.\s*/g, ".\n") // Add newline after periods
    .split("\n") // Split by newline
    .map((line, index) => <p key={index}>{line.trim()}</p>);

  return (
    <>
      <div className="h-screen grid grid-cols-[1.5fr_3fr_3fr] gap-4 p-4">
        {/* Left column - static */}
        <div className="border-2 p-4">
          <h2 className="font-bold text-3xl mb-2 pt-2 pb-12">Adjustments</h2>
          <h3 className="pb-4 font-bold text-xl">Difficulty</h3>
          <RadioGroup
            defaultValue="option-one"
            value={level}
            onValueChange={handleLevelChange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mild" id="mild" />
              <Label htmlFor="mild" className="text-lg font-bold">
                Mild
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderate" id="moderate" />
              <Label htmlFor="moderate" className="text-lg font-bold">
                Moderate
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="severe" id="severe" />
              <Label htmlFor="severe" className="text-lg font-bold">
                {" "}
                Severe
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Middle column - scrollable */}
        <div className="border-2 p-4 overflow-y-auto h-full">
          <div className="flex flex-row gap-4 pt-2 pb-6">
            {" "}
            <h2 className="font-bold text-4xl mb-2 ">Refined Text </h2>
          </div>

          <div className="space-y-4 leading-10 text-xl font-bold">
            {formattedRephrased || defaultText}
          </div>
        </div>

        {/* Right column - scrollable */}
        <div className="border-2 p-4 overflow-y-auto h-full">
          <div className="flex flex-row gap-4 pt-2 pb-6">
            <h2 className="font-bold text-4xl mb-2 ">Summary </h2>
          </div>

          <div className="space-y-4 leading-10 text-xl font-bold">
            {summary || "Loading summary... just a second!"}
          </div>
        </div>
      </div>
    </>
  );
}