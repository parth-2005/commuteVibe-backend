import { IsNumber, IsString, IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class LegDto {
  @IsString()
  mode: string

  @IsString()
  fromLabel: string

  @IsString()
  toLabel: string

  @IsNumber()
  fromLat: number

  @IsNumber()
  fromLng: number

  @IsNumber()
  toLat: number

  @IsNumber()
  toLng: number

  @IsNumber()
  durationMin: number
}

export class CreateRouteDto {
  @IsNumber()
  originLat: number

  @IsNumber()
  originLng: number

  @IsNumber()
  destLat: number

  @IsNumber()
  destLng: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegDto)
  legs: LegDto[]

  @IsString()
  transitMode: string

  @IsNumber()
  durationMin: number

  @IsOptional()
  @IsBoolean()
  chosenByAi?: boolean
}
