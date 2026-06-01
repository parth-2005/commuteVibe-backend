import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator'

export class CreateAlarmDto {
  @IsString()
  label: string

  @IsNumber()
  destLat: number

  @IsNumber()
  destLng: number

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  radiusMeters?: number
}
