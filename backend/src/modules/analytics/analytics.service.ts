import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getReport(query: any) { /* TODO: реалізувати звіти */ }
  async getFuelStats(query: any) { /* TODO: статистика палива */ }
  async getVehicleUtilization(query: any) { /* TODO: завантаженість ТЗ */ }
}
