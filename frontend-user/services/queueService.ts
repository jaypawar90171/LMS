import api from "@/constants/api";

export const queueService = {
  getUserQueues() {
    return api.get("/api/mobile/queue");
  },
  getQueueDetails(queueId: string) {
    return api.get(`/api/mobile/queue/${queueId}`);
  },
  withdraw(queueId: string) {
    return api.delete(`/api/mobile/queue/${queueId}/leave`);
  },
};
