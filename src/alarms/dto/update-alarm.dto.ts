import { IsBoolean, IsOptional, IsNumber, IsString, Min, Max } from 'class-validator'

export class UpdateAlarmDto {
  @IsOptional()
  @IsString()
  label?: string

  @IsOptional()
  @IsNumber()
  destLat?: number

  @IsOptional()
  @IsNumber()
  destLng?: number

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  radiusMeters?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
