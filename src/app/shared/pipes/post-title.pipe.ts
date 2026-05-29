import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { displayPostTitle } from '../../core/utils/post-display';

@Pipe({
  name: 'postTitle',
  standalone: true
})
export class PostTitlePipe implements PipeTransform {
  private transloco = inject(TranslocoService);

  transform(title: string | null | undefined): string {
    return displayPostTitle(title, this.transloco.translate('common.untitledPost'));
  }
}
