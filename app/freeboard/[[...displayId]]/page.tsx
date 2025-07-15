"use client";
import { useParams } from "next/navigation";
import FreeboardEditor from "../components/FreeboardEditor";

export default function FreeboardPage() {
  const params = useParams();
  const displayId = Array.isArray(params?.displayId)
    ? params.displayId[0]
    : params?.displayId;
  return <FreeboardEditor displayId={displayId} />;
} 