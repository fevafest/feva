import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogService } from '../../core/services/blog.service';
import { BlogPost } from '../../core/models/blog.model';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-blog-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FileUrlPipe, LoadingSpinnerComponent],
  templateUrl: './blog-details.html',
  styleUrl: './blog-details.scss',
})
export class BlogDetailsComponent implements OnInit {
  readonly post = signal<BlogPost | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  constructor(private readonly route: ActivatedRoute, private readonly blogService: BlogService) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.blogService.getBySlug(slug).subscribe({
      next: (res) => {
        this.post.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }
}
