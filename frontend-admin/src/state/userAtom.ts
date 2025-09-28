import { atomWithStorage } from "jotai/utils";
import { User } from "../interfaces/user.interface";

export const userAtom = atomWithStorage<User | null>("currentUser", null);
