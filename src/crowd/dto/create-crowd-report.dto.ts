import { IsNumber, IsInt, Min, Max } from 'class-validator'

export class CreateCrowdReportDto {
  @IsNumber()
  lat: number

  @IsNumber()
  lng: number

  @IsInt()
  @Min(1)
  @Max(3)
  level: number
}
