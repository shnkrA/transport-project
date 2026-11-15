import { Injectable } from '@nestjs/common';

@Injectable()
export class GpsService {
  async updatePosition(data: { vehicleId: number; latitude: number; longitude: number; speed?: number }) {
    /* TODO: зберегти GPS-координати */
  }

  async getCurrentPosition(vehicleId: number) {
    /* TODO: отримати поточну позицію */
  }

  async getHistory(query: { vehicleId: number; from: string; to: string }) {
    /* TODO: отримати історію координат */
  }
}
