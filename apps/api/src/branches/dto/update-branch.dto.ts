import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateBranchDto } from './create-branch.dto';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiPropertyOptional({
    description: 'Parent restaurant concept ID (immutable)',
  })
  @IsUUID('4')
  @IsOptional()
  restaurantId?: string;
}
