import { useContext } from "react";
import { BranchContext } from "./BranchProvider";

export const useBranch = () => useContext(BranchContext);
