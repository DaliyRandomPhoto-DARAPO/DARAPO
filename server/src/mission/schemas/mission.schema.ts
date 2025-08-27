import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MissionDocument = Mission & Document;

@Schema({ timestamps: true })
export class Mission {
  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, unique: true })
  date: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  imageUrl: string;
}

export const MissionSchema = SchemaFactory.createForClass(Mission);
