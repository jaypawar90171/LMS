import Activity from "../models/activity.model";
import { IActivity } from "../interfaces/activity.interface";

/**
 * A reusable function to log user and system activities.
 *
 * @param actor - The user who performed the action.
 * @param actionType - The type of action performed (e.g., 'USER_CREATED').
 * @param target - The entity that was affected by the action.
 * @param description - A human-readable description of the activity.
 * @param metadata - Optional additional data about the event.
 */

export const logActivity = async (
  actor: IActivity["actor"],
  actionType: IActivity["actionType"],
  target: IActivity["target"],
  description: string,
  metadata?: object
): Promise<void> => {
  try {
    await Activity.create({
      actor,
      actionType,
      target,
      description,
      metadata: metadata || {},
    });
    console.log(`Activity logged: ${description}`);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
